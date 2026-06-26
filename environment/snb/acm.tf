# 1. Buscamos el certificado que ya existe en AWS
data "aws_acm_certificate" "frontend" {
  provider = aws.us_east_1
  domain   = "snbrepresentaciones.com.ar"
  statuses = ["ISSUED"] # Esto es clave: solo queremos el que ya está emitido
}

# 2. Como ya lo obtuvimos con el 'data', NO necesitamos el recurso 
# 'aws_route53_record' ni 'aws_acm_certificate_validation'. 
# Esos ya no tienen sentido porque el certificado ya está validado y emitido.

# 3. Solo mantenemos el output para usarlo en CloudFront
output "certificate_arn" {
  value = data.aws_acm_certificate.frontend.arn
}