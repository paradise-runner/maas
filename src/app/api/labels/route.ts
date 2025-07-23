import { NextRequest, NextResponse } from 'next/server';
import { ServiceLabelsDB } from '@/lib/database';

export async function GET() {
  try {
    const labels = ServiceLabelsDB.getAllLabels();
    return NextResponse.json({ labels });
  } catch (error) {
    console.error('Error fetching labels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch labels' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { label } = await request.json();
    
    if (!label || typeof label !== 'string' || label.trim() === '') {
      return NextResponse.json(
        { error: 'Label is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const newLabel = ServiceLabelsDB.addLabel(label.trim());
    return NextResponse.json({ label: newLabel }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding label:', error);
    
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json(
        { error: 'Label already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add label' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const labelName = searchParams.get('label');
    
    if (!id && !labelName) {
      return NextResponse.json(
        { error: 'Either id or label parameter is required' },
        { status: 400 }
      );
    }

    let success = false;
    if (id) {
      success = ServiceLabelsDB.removeLabel(parseInt(id, 10));
    } else if (labelName) {
      success = ServiceLabelsDB.removeLabelByName(labelName);
    }

    if (success) {
      return NextResponse.json({ message: 'Label deleted successfully' });
    } else {
      return NextResponse.json(
        { error: 'Label not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting label:', error);
    return NextResponse.json(
      { error: 'Failed to delete label' },
      { status: 500 }
    );
  }
}