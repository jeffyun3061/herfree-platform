plugins {
    java
    id("org.springframework.boot") version "3.3.6"
    id("io.spring.dependency-management") version "1.1.6"
}

group = "com.herfree"
version = "0.1.0-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

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

    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.6.0")

    implementation("software.amazon.awssdk:s3:2.29.45")

    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")

    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("com.h2database:h2")

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

tasks.named<org.springframework.boot.gradle.tasks.run.BootRun>("bootRun") {
    // bootRun working directory = backend module (local-secrets.yml 경로 고정)
    workingDir = layout.projectDirectory.asFile
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
