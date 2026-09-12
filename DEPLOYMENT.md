# Production deployment

This application supports both Vercel and a standard Node.js/Docker host such as AWS ECS Fargate or EC2. Both deployments must use the **same MongoDB database and Firebase project** if they are expected to serve the same users and records.

## Vercel

Connect the repository and deploy the production branch. In Vercel Project Settings, add these variables for the **Production** environment:

- **Secret:** `MONGODB_URI`, `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`
- **Config:** all `NEXT_PUBLIC_FIREBASE_*` variables and `NEXT_PUBLIC_SITE_URL`

After changing any `NEXT_PUBLIC_*` variable, redeploy: Next.js embeds public values at build time.

## AWS ECS/Fargate (recommended)

1. Create an ECR repository and build this repository's `Dockerfile` in CI.
2. Pass the public `NEXT_PUBLIC_*` values as Docker build arguments.
3. Push the resulting image to ECR.
4. Create an ECS Fargate service behind an Application Load Balancer, exposing container port `3000`.
5. Put `MONGODB_URI` and the three `FIREBASE_ADMIN_*` values in AWS Secrets Manager, and inject them into the ECS task as secrets. Do not bake them into the image, task definition, or source control.
6. Configure the ALB health check as `GET /api/health` and enable HTTPS with ACM.

The Docker build sets `NEXT_OUTPUT=standalone` only for AWS. Vercel keeps the standard Next.js output that its build adapter requires. The container starts with `node server.js`, listens on `0.0.0.0:3000`, and includes its own `/api/health` health check.

### Local container verification

Use a non-committed environment file containing only server variables. Supply public Firebase values during the build, then start with runtime secrets:

```bash
docker build -t health-care-hms \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=... \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=... \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID=... \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID=... \
  --build-arg NEXT_PUBLIC_SITE_URL=https://your-domain.example .

docker run --rm -p 3000:3000 --env-file .env.production health-care-hms
```

## Database access

MongoDB Atlas must allow the AWS and Vercel deployments to connect. Do not allow only a developer machine IP. Use a stable AWS egress IP/PrivateLink where possible; if a temporary broad allowlist is required for testing, protect the database with a strong unique credential and replace it with a restricted network rule afterwards.

## Domains, HTTPS, and Firebase

Use HTTPS domains for both deployments. Do **not** use a raw AWS public IP such as `http://15.x.x.x` for production: the application deliberately marks authentication cookies as secure in production, and browsers will not retain them over HTTP.

1. Point a domain such as `hospital.example.com` to the AWS Application Load Balancer and issue its TLS certificate with ACM.
2. In Firebase Console → Authentication → Settings → Authorized domains, add the Vercel domain and the AWS custom domain.
3. Build the AWS image with `NEXT_PUBLIC_SITE_URL=https://hospital.example.com`.
4. Set Vercel's `NEXT_PUBLIC_SITE_URL` to its own public domain.

The Firebase Web SDK configuration can be the same on both hosts. Firebase Admin and MongoDB values stay private server-side secrets on both platforms.
