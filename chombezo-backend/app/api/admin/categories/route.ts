import { NextRequest, NextResponse } from 'next/server';
import { getCategoriesAdmin } from '@/lib/db';
import { requireAdminAuth } from '@/lib/admin-auth';
import { parseInput, PaginationSchema } from '@/lib/validation';
import { createErrorResponse, ValidationError } from '@/lib/errors';
import { HTTP_STATUS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const validation = parseInput(PaginationSchema, { page, limit });
    if (!validation.success) {
      throw new ValidationError('Invalid pagination parameters', validation.errors);
    }

    const offset = (validation.data.page - 1) * validation.data.limit;
    const { categories, total } = await getCategoriesAdmin(validation.data.limit, offset);

    return NextResponse.json(
      {
        success: true,
        data: {
          categories,
          pagination: {
            page: validation.data.page,
            limit: validation.data.limit,
            total,
            totalPages: Math.ceil(total / validation.data.limit),
          },
        },
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      createErrorResponse(error),
      { status: (error as any).statusCode || HTTP_STATUS.INTERNAL_ERROR }
    );
  }
}
