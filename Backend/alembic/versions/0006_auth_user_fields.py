"""Auth User fields: email, auth_provider, google_id and purge legacy analyst/investigator demo entries

Revision ID: 0006_auth_user_fields
Revises: 0005_quishing_image_analysis
Create Date: 2026-09-11 19:50:00

"""
from alembic import op
import sqlalchemy as sa

revision = '0006_auth_user_fields'
down_revision = '0005_quishing_image_analysis'
branch_labels = None
depends_on = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    if 'users' in existing_tables:
        user_columns = [col['name'] for col in inspector.get_columns('users')]

        if 'email' not in user_columns:
            op.add_column('users', sa.Column('email', sa.String(255), nullable=True))
            try:
                op.create_index('ix_users_email', 'users', ['email'], unique=True)
            except Exception:
                pass

        if 'auth_provider' not in user_columns:
            op.add_column('users', sa.Column('auth_provider', sa.String(32), server_default='local', nullable=False))

        if 'google_id' not in user_columns:
            op.add_column('users', sa.Column('google_id', sa.String(128), nullable=True))
            try:
                op.create_index('ix_users_google_id', 'users', ['google_id'], unique=True)
            except Exception:
                pass

        try:
            op.alter_column('users', 'hashed_password', existing_type=sa.String(255), nullable=True)
        except Exception:
            pass

        # Clean legacy demo user entries if present
        try:
            conn.execute(sa.text("DELETE FROM users WHERE username IN ('analyst1', 'lead_investigator', 'analyst2') OR role IN ('analyst', 'investigator')"))
        except Exception:
            pass


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    if 'users' in existing_tables:
        user_columns = [col['name'] for col in inspector.get_columns('users')]

        if 'google_id' in user_columns:
            try:
                op.drop_index('ix_users_google_id', table_name='users')
            except Exception:
                pass
            op.drop_column('users', 'google_id')

        if 'auth_provider' in user_columns:
            op.drop_column('users', 'auth_provider')

        if 'email' in user_columns:
            try:
                op.drop_index('ix_users_email', table_name='users')
            except Exception:
                pass
            op.drop_column('users', 'email')
