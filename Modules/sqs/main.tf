resource "aws_sqs_queue" "terraform_queue" {
  name                      = "${var.project_name}-queue"
  delay_seconds             = 90
  max_message_size          = 2048
  message_retention_seconds = 86400
  receive_wait_time_seconds = 10
  visibility_timeout_seconds = 60   ### se debe considerar el tiempo promedio del lambda worker para dejar un margen seguro ###
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.terraform_queue_deadletter.arn
    maxReceiveCount     = 4
  })

  tags = {
    Environment = var.environment
  }
}

resource "aws_sqs_queue" "terraform_queue_deadletter" {
  name = var.deadletter_name
}

resource "aws_sqs_queue_redrive_allow_policy" "terraform_queue_redrive_allow_policy" {
  queue_url = aws_sqs_queue.terraform_queue_deadletter.id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue",
    sourceQueueArns   = [aws_sqs_queue.terraform_queue.arn]
  })
}

output "sqs_arn" {
  value = aws_sqs_queue.terraform_queue.arn
}

output "sqs_url" {
    value = aws_sqs_queue.terraform_queue.url
  
}