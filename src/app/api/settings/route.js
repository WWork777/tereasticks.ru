import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT key, value FROM site_settings");
    const settings = {};
    for (const row of rows || []) {
      settings[row.key] = row.value;
    }
    return NextResponse.json({ settings });
  } catch (error) {
    // If site_settings table doesn't exist yet, return defaults
    return NextResponse.json({
      settings: {
        maintenance_mode: 'false',
        accept_orders: 'true',
        site_notice_enabled: 'false',
        site_notice: '',
        maintenance_message: '',
      }
    });
  }
}
