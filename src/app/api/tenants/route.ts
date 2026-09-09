import { NextResponse } from 'next/server';
import { getTenants, updateTenantSettings } from '@/lib/db/queries';

export async function GET() {
  try {
    const tenants = await getTenants();
    return NextResponse.json({ tenants });
  } catch (error) {
    console.error('Failed to get tenants:', error);
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { tenantId, name, brandColor, plan } = body;
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }
    await updateTenantSettings(tenantId, { name, brandColor, plan });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update tenant settings:', error);
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
  }
}
