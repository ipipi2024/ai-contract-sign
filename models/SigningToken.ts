// models/SigningToken.ts
import mongoose from 'mongoose';

const signingTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
    required: true
  },
  recipientEmail: {
    type: String,
    required: true
  },
  party: {
    type: String,
    required: true,
    enum: ['PartyA', 'PartyB']
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 hours
  },
  used: {
    type: Boolean,
    default: false
  },
  usedAt: Date,
  ipAddress: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// TTL index for automatic cleanup
signingTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.SigningToken || mongoose.model('SigningToken', signingTokenSchema);