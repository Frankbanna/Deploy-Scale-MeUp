อธิบาย CI/CD Template
CI/CD คือการทำให้การ build, test และ deploy เป็นอัตโนมัติทั้งหมด ในโปรเจคนี้ เราใช้ GitHub Actions เพื่อ build Docker image ทุกครั้งที่มีการ push โค้ดไปที่ main หรือ dev จากนั้นเชื่อมต่อ AWS ด้วย OIDC แล้ว push image ไปเก็บใน Amazon ECR ทำให้ทีมมี image เวอร์ชันล่าสุดพร้อม deploy ได้ทันที โดยไม่ต้องทำ manual process เอง

ขั้นตอนการทำงานหลัก (ละเอียด)
1.Trigger เมื่อมีการ Push โค้ดไปที่ branches main หรือ dev
2.กำหนดสิทธิ์ เปิดสิทธิ์ id-token: write เพื่อให้แอ็กชันสามารถขอ Token และปิดสิทธิ์ contents: read เพื่อให้ดึงซอร์สโค้ดจาก repo ได้
3.กำหนดงาน ชื่อ deploy รันบนเครื่อง ubuntu-latest ซึ่งเป็น GitHub-hosted runner มาตรฐาน
4.Checkout โค้ดจาก Repositoryใช้แอ็กชัน actions/checkout@v3 เพื่อดึงซอร์สเวอร์ชันล่าสุดมาใช้ในการ build image
5.ตั้งค่า AWS Credentials
ใช้แอ็กชัน aws-actions/configure-aws-credentials@v4 กำหนด role-to-assume เป็น ARN ของ role ในบัญชี AWS ที่อ้างอิงด้วย ${{ secrets.AWS_ACCOUNT_ID }} และใส่ Region จาก ${{ secrets.AWS_REGION }}
ขั้นตอนนี้ทำให้ Job ได้รับ temporary credentials สำหรับสั่ง AWS CLI โดยไม่ต้องเก็บ Access Key ถาวรใน repo
6.Build → Tag → Push Docker Image ไปที่ Amazon ECR
-Build & Tag: สร้าง image จาก Dockerfile ในโปรเจ็กต์ และ ติดแท็กเป็น :latest
-Login เข้าคลังภาพ ใช้คำสั่ง
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
เพื่อเข้าสู่ระบบ Amazon ECR Public 
-Push Image: อัปโหลด image ที่ tag :latest ขึ้น ECR ตาม pathเพื่อให้ทีมสามารถนำไป deploy ต่อในสเต็ปถัดไปได้ทันที
สรุป
ทุกครั้งที่มีการ push ไป main/dev, Workflow จะดึงโค้ด, ขอสิทธิ์ AWS โดย Assume Role, แล้ว build และ tag Docker image เป็น :latest จากนั้น login เข้า ECR Public และ push image ขึ้นรีโปทันที ทำให้เราได้อิมเมจเวอร์ชันล่าสุดพร้อมนำไป deploy ต่อได้อย่างอัตโนมัติและปลอดภัย”
