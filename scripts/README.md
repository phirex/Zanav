# Database Connection Scripts

## Remote Supabase Database Connection

Your project is now connected to the remote Supabase database. This prevents accidentally working with local data when you want to work with production data.

### Quick Commands

```bash
# Check connection status
./scripts/connect-remote-db.sh status

# Pull latest schema from remote
./scripts/connect-remote-db.sh pull

# Push migrations to remote
./scripts/connect-remote-db.sh push

# View remote logs
./scripts/connect-remote-db.sh logs

# Open remote Supabase Studio
./scripts/connect-remote-db.sh studio
```

### Project Details

- **Project Reference**: `nlpsmauwwlnblgwtawbs`
- **Project Name**: New Zanav
- **Region**: eu-north-1
- **Organization**: obwfejsslwpmjndsxrei

### Important Notes

1. **Always check which database you're working with** before running commands
2. **Local development** uses `supabase start` and `supabase stop`
3. **Remote development** uses the connection script
4. **Migrations** should be pushed to remote after testing locally

### Switching Between Local and Remote

```bash
# For local development
supabase start
supabase stop

# For remote development
./scripts/connect-remote-db.sh pull
./scripts/connect-remote-db.sh push
```

### Environment Variables

Make sure your `.env.local` file points to the correct Supabase URL:

```bash
# For local development
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key

# For remote development
NEXT_PUBLIC_SUPABASE_URL=https://nlpsmauwwlnblgwtawbs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_remote_anon_key
```
