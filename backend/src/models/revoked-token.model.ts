import mongoose, { Schema, Document } from 'mongoose';

export interface IRevokedToken extends Document {
  tokenHash: string;
  revokedAt: Date;
  expiresAt: Date;
}

const RevokedTokenSchema = new Schema<IRevokedToken>({
  tokenHash: { type: String, required: true, unique: true, index: true },
  revokedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export const RevokedTokenModel = mongoose.model<IRevokedToken>('RevokedToken', RevokedTokenSchema);
