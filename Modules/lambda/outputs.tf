output "lambda_invoke_arn" {
  value = aws_lambda_function.general_lambda.invoke_arn
}

output "lambda_function_name" {
  value = aws_lambda_function.general_lambda.function_name
}

output "lambda_arn" {
  value = aws_lambda_function.general_lambda.arn
  
}