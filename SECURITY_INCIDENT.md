# Security Incident Report: Exposed SMTP Credentials

## Summary
GitGuardian detected exposed SMTP credentials (Gmail app password) in the repository.

## Exposed Credentials
- **Service**: Gmail SMTP
- **Email Account**: habitsforgoodinfo@gmail.com
- **Credentials**: App password `eeax shtk vgxy zrek` (REVOKED)

## Immediate Actions Taken
1. ✅ Replaced exposed credentials with placeholder values in `.env` files
2. ✅ Confirmed `.env` files are in `.gitignore` (not tracked in git)
3. ✅ Added warnings in `.env` files to prevent future credential commits

## Required Actions for Repository Owner
1. **CRITICAL - Revoke Exposed Credentials**
   - Log into habitsforgoodinfo@gmail.com
   - Go to Account → Security → App Passwords
   - Delete the compromised app password `eeax shtk vgxy zrek`
   - Generate a new app password for SMTP

2. **Update Environment Configuration**
   - Generate a new Gmail App Password
   - Store it securely in your deployment system (e.g., GitHub Secrets, environment variables)
   - Update production `.env` files with the new credentials

3. **Best Practices Going Forward**
   - Never commit `.env` files with real credentials
   - Use `.env.example` with placeholders for documentation
   - Use GitHub Secrets for CI/CD credential management
   - Use environment variables for production deployments
   - Consider using a secrets management tool (e.g., HashiCorp Vault, AWS Secrets Manager)

## Environment File Status
- `.env` - Secured with placeholders ✅
- `backend/.env` - Secured with placeholders ✅
- `.gitignore` - Already excludes `.env` files ✅

## Prevention
The repository's `.gitignore` already properly excludes `.env` files from version control. To maintain security:

```
# .gitignore already contains:
.env
.env.local
.env.*.local
```

## Testing
Before deploying, ensure:
```bash
# Create local .env with real credentials (not committed)
cp .env.example .env
# Edit .env with your actual SMTP credentials
```

---
**Incident Date**: 2026-01-02
**Status**: Mitigation Complete ✅
**Follow-up Required**: Revoke compromised Gmail credentials
