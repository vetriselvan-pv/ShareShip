import { FastifyInstance } from 'fastify';
import { RelativeModel, IRelative } from '../models/index.js';
import { isMongoConnected } from '../db/connection.js';
import { validateBody, CreateRelativeSchema, CreateRelativeInput } from '../validation/index.js';

// Resilient in-memory master list if MongoDB is offline
const inMemoryRelatives: IRelative[] = [];

export async function relativesRoutes(fastify: FastifyInstance) {
  // GET /api/relatives - List relatives from Master (MongoDB or in-memory fallback)
  fastify.get('/api/relatives', async (request) => {
    const query = request.query as { q?: string; userId?: string };
    const searchTerm = (query.q || '').trim().toLowerCase();

    let relatives: IRelative[] = [];

    if (isMongoConnected) {
      try {
        let filter: any = {};
        if (searchTerm) {
          filter.$or = [
            { firstName: { $regex: searchTerm, $options: 'i' } },
            { lastName: { $regex: searchTerm, $options: 'i' } },
            { village: { $regex: searchTerm, $options: 'i' } },
          ];
        }
        relatives = await RelativeModel.find(filter).sort({ createdAt: -1 }).lean();
      } catch (err) {
        fastify.log.warn('MongoDB query fallback for relatives: ' + err);
        relatives = inMemoryRelatives;
      }
    } else {
      relatives = inMemoryRelatives;
    }

    if (searchTerm && (!isMongoConnected || relatives === inMemoryRelatives)) {
      relatives = relatives.filter(r =>
        r.firstName.toLowerCase().includes(searchTerm) ||
        (r.lastName && r.lastName.toLowerCase().includes(searchTerm)) ||
        r.village.toLowerCase().includes(searchTerm)
      );
    }

    return {
      success: true,
      relatives,
      count: relatives.length
    };
  });

  // POST /api/relatives - Create relative in Master
  fastify.post('/api/relatives', { preHandler: validateBody(CreateRelativeSchema) }, async (request, reply) => {
    const body = request.body as CreateRelativeInput;

    const newRelative: IRelative = {
      id: `rel_${Date.now()}`,
      userId: body.userId || '',
      firstName: body.firstName.trim(),
      lastName: (body.lastName || '').trim(),
      village: body.village.trim(),
      phone: (body.phone || '').trim(),
      relationship: (body.relationship || '').trim(),
      createdAt: new Date(),
    };

    if (isMongoConnected) {
      try {
        await RelativeModel.create(newRelative);
      } catch (err) {
        fastify.log.error('Failed to save relative in MongoDB: ' + err);
      }
    }

    inMemoryRelatives.unshift(newRelative);

    return reply.code(201).send({
      success: true,
      relative: newRelative
    });
  });

  // DELETE /api/relatives/:id - Remove relative from Master
  fastify.delete('/api/relatives/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    if (isMongoConnected) {
      try {
        await RelativeModel.deleteOne({ id });
      } catch (err) {
        fastify.log.warn('MongoDB relative delete fallback: ' + err);
      }
    }

    const idx = inMemoryRelatives.findIndex(r => r.id === id);
    if (idx !== -1) {
      inMemoryRelatives.splice(idx, 1);
    }

    return { success: true, message: `Relative ${id} deleted` };
  });
}
