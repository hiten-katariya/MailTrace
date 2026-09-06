"""Quishing & OCR Image Analysis schema: has_qr_code, qr_decoded_url, ocr_extracted_text, image_only_lure_flag on attachments

Revision ID: 0005_quishing_image_analysis
Revises: 0004_gmail_trash_and_message_id
Create Date: 2026-09-06 17:50:00

"""
from alembic import op
import sqlalchemy as sa

revision = '0005_quishing_image_analysis'
down_revision = '0004_gmail_trash_and_message_id'
branch_labels = None
depends_on = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    if 'attachments' in existing_tables:
        attachment_columns = [col['name'] for col in inspector.get_columns('attachments')]

        if 'has_qr_code' not in attachment_columns:
            op.add_column('attachments', sa.Column('has_qr_code', sa.Boolean(), server_default=sa.false(), nullable=False))

        if 'qr_decoded_url' not in attachment_columns:
            op.add_column('attachments', sa.Column('qr_decoded_url', sa.Text(), nullable=True))

        if 'ocr_extracted_text' not in attachment_columns:
            op.add_column('attachments', sa.Column('ocr_extracted_text', sa.Text(), nullable=True))

        if 'image_only_lure_flag' not in attachment_columns:
            op.add_column('attachments', sa.Column('image_only_lure_flag', sa.Boolean(), server_default=sa.false(), nullable=False))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    if 'attachments' in existing_tables:
        attachment_columns = [col['name'] for col in inspector.get_columns('attachments')]

        if 'image_only_lure_flag' in attachment_columns:
            op.drop_column('attachments', 'image_only_lure_flag')

        if 'ocr_extracted_text' in attachment_columns:
            op.drop_column('attachments', 'ocr_extracted_text')

        if 'qr_decoded_url' in attachment_columns:
            op.drop_column('attachments', 'qr_decoded_url')

        if 'has_qr_code' in attachment_columns:
            op.drop_column('attachments', 'has_qr_code')
