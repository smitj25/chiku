import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    # Use the DIRECT_URL or DATABASE_URL from Supabase
    db_url = os.environ.get("DIRECT_URL") or os.environ.get("DATABASE_URL")
    if not db_url:
        return None
    try:
        conn = psycopg2.connect(db_url)
        return conn
    except Exception as e:
        print(f"DB Connection Error: {e}")
        return None

def log_api_call(api_key: str, plug_id: str, endpoint: str, status: int, latency_ms: int):
    conn = get_db_connection()
    if not conn:
        return
    try:
        with conn.cursor() as cur:
            import hashlib
            key_hash = hashlib.sha256(api_key.encode()).hexdigest()
            
            # 1. Find the ApiKey record to get tenantId
            cur.execute('SELECT id, "tenantId" FROM "ApiKey" WHERE "keyHash" = %s', (key_hash,))
            row = cur.fetchone()
            
            tenant_id = None
            api_key_id = None
            
            if row:
                api_key_id = row[0]
                tenant_id = row[1]
            else:
                # If it's a dev key, maybe try to find a default tenant or skip
                # Let's see if we can just get any tenant as fallback for dev
                cur.execute('SELECT id FROM "Tenant" LIMIT 1')
                fallback = cur.fetchone()
                if not fallback:
                    return # No tenants in DB
                tenant_id = fallback[0]
            
            # 2. Insert ApiCall
            import cuid
            call_id = cuid.cuid()
            cur.execute('''
                INSERT INTO "ApiCall" (id, "tenantId", "apiKeyId", "plugId", endpoint, status, "latencyMs", "createdAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            ''', (call_id, tenant_id, api_key_id, plug_id, endpoint, status, latency_ms))
            
            conn.commit()
    except Exception as e:
        print(f"Failed to log API call: {e}")
    finally:
        conn.close()

def log_document(filename: str, size_bytes: int, plug_id: str, api_key: str):
    conn = get_db_connection()
    if not conn:
        return
    try:
        with conn.cursor() as cur:
            import hashlib
            from string import Template
            tenant_id = None
            if api_key:
                key_hash = hashlib.sha256(api_key.encode()).hexdigest()
                cur.execute('SELECT "tenantId" FROM "ApiKey" WHERE "keyHash" = %s', (key_hash,))
                row = cur.fetchone()
                if row:
                    tenant_id = row[0]
            
            if not tenant_id:
                cur.execute('SELECT id FROM "Tenant" LIMIT 1')
                fallback = cur.fetchone()
                if not fallback:
                    return
                tenant_id = fallback[0]
                
            import cuid
            doc_id = cuid.cuid()
            cur.execute('''
                INSERT INTO "Document" (id, "tenantId", "plugId", filename, "sizeBytes", "createdAt")
                VALUES (%s, %s, %s, %s, %s, NOW())
            ''', (doc_id, tenant_id, plug_id, filename, size_bytes))
            conn.commit()
    except Exception as e:
        print(f"Failed to log document: {e}")
    finally:
        conn.close()

def get_api_usage(api_key: str):
    total_calls = 0
    user_calls = 0
    per_plugin = {}
    
    conn = get_db_connection()
    if not conn:
        return total_calls, user_calls, per_plugin
    try:
        with conn.cursor() as cur:
            # Get total calls this month for ALL users
            cur.execute('''
                SELECT COUNT(*) FROM "ApiCall"
                WHERE "createdAt" >= date_trunc('month', CURRENT_DATE)
            ''')
            row = cur.fetchone()
            if row: total_calls = row[0]
            
            # Get calls by plugin this month for ALL users
            cur.execute('''
                SELECT "plugId", COUNT(*) FROM "ApiCall"
                WHERE "createdAt" >= date_trunc('month', CURRENT_DATE)
                GROUP BY "plugId"
            ''')
            for row in cur.fetchall():
                plug_id = row[0].replace("-v1", "")
                per_plugin[plug_id] = per_plugin.get(plug_id, 0) + row[1]
            
            # Get calls by specifically this API key
            if api_key:
                import hashlib
                key_hash = hashlib.sha256(api_key.encode()).hexdigest()
                cur.execute('''
                    SELECT COUNT(*) FROM "ApiCall"
                    WHERE "createdAt" >= date_trunc('month', CURRENT_DATE)
                      AND "apiKeyId" = (SELECT id FROM "ApiKey" WHERE "keyHash" = %s)
                ''', (key_hash,))
                row = cur.fetchone()
                if row: user_calls = row[0]
            
    except Exception as e:
        print(f"Failed to get API usage: {e}")
    finally:
        conn.close()
        
    return total_calls, user_calls, per_plugin

def get_plugin_config(api_key: str, plug_id: str):
    conn = get_db_connection()
    if not conn:
        return None
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            import hashlib
            tenant_id = None
            if api_key:
                key_hash = hashlib.sha256(api_key.encode()).hexdigest()
                cur.execute('SELECT "tenantId" FROM "ApiKey" WHERE "keyHash" = %s', (key_hash,))
                row = cur.fetchone()
                if row:
                    tenant_id = row['tenantId']
            
            if not tenant_id:
                cur.execute('SELECT id FROM "Tenant" LIMIT 1')
                fallback = cur.fetchone()
                if not fallback:
                    return None
                tenant_id = fallback['id']
                
            cur.execute('''
                SELECT persona, "decisionTree", guardrails 
                FROM "PluginConfig" 
                WHERE "tenantId" = %s AND "pluginId" = %s
            ''', (tenant_id, plug_id))
            return cur.fetchone()
    except Exception as e:
        print(f"Failed to get plugin config: {e}")
        return None
    finally:
        conn.close()
