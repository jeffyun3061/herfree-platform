plugins {
    java
    id("org.springframework.boot") version "4.1.0"
    id("io.spring.dependency-management") version "1.1.6"
}

group = "com.herfree"
version = "0.1.0-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

// Trivy release gate: Netty CVE-2026-59901/55831/55833/56745 (4.1.136.Final+)
extra["netty.version"] = "4.1.136.Final"

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-mail")
    implementation("com.mysql:mysql-connector-j")

    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-mysql")

    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.17")

    implementation("software.amazon.awssdk:s3:2.29.45")

    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")

    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("com.h2database:h2")
    testImplementation("org.testcontainers:junit-jupiter")
    testImplementation("org.testcontainers:mysql")

    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.test {
    useJUnitPlatform()
    // Windows + 한글/OneDrive 경로에서 forked test worker ClassNotFound 방지
    maxParallelForks = 1
    jvmArgs(
        "-Dfile.encoding=UTF-8",
        "-Dsun.jnu.encoding=UTF-8",
    )
}

tasks.processResources {
    // gitignore만으로는 로컬 파일이 JAR에 들어가는 것을 막지 못하므로 산출물에서 강제 제외한다.
    exclude(
        "application-local.yml",
        "application-prod.yml",
        "application-secret.yml",
        "local-secrets.yml",
        "secrets/**",
    )
}

tasks.named<org.springframework.boot.gradle.tasks.run.BootRun>("bootRun") {
    // bootRun working directory = backend module (local-secrets.yml 경로 고정)
    workingDir = layout.projectDirectory.asFile
    // 공통 설정은 배포 실수를 숨기지 않는다. local 프로필은 로컬 실행 명령에서만 명시한다.
    args(
        "--spring.profiles.active=local",
        "--spring.config.additional-location=optional:file:src/main/resources/application-local.yml",
    )
}

val verifyNoSecretResources by tasks.registering {
    group = "verification"
    dependsOn(tasks.named("bootJar"))
    doLast {
        val bootJar = tasks.named<org.springframework.boot.gradle.tasks.bundling.BootJar>("bootJar").get()
        val forbidden = zipTree(bootJar.archiveFile.get().asFile).matching {
            include(
                "**/application-local.yml",
                "**/application-prod.yml",
                "**/application-secret.yml",
                "**/local-secrets.yml",
                "**/secrets/**",
            )
        }.files
        if (forbidden.isNotEmpty()) {
            throw GradleException("Secret-bearing resources found in bootJar: ${forbidden.joinToString()}")
        }
    }
}

tasks.named("check") {
    dependsOn(verifyNoSecretResources)
}

// build 는 컴파일+테스트만. 서버 실행은 run-local.ps1 또는 bootRun 사용.
tasks.register("printRunHelp") {
    group = "application"
    description = "Show how to start the API server locally"
    doLast {
        println(
            """
            |=== Herfree Backend Run ===
            |Compile & test : ./gradlew build
            |Start API      : ./run-local.ps1   (recommended — frees port 8080 first)
            |Direct bootRun : ./gradlew bootRun  (fails if port 8080 is already in use)
            |S3 keys        : backend/local-secrets.yml (gitignored)
            """.trimMargin()
        )
    }
}
