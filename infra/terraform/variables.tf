variable "aws_region" {
  type        = string
  description = "Deployment region."
  default     = "ap-northeast-2"
}

variable "environment" {
  type        = string
  description = "Environment name used for tags and state separation."

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be staging or production."
  }
}
