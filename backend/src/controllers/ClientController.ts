import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Client } from '../entities/Client';
import { Repository } from 'typeorm';
import { validate } from 'class-validator';

export class ClientController {
  private clientRepository: Repository<Client>;

  constructor() {
    this.clientRepository = AppDataSource.getRepository(Client);
  }

  // Create a new client
  async createClient(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        email,
        phone,
        address,
        city,
        state,
        postalCode,
        country,
        contactPerson,
        contactTitle,
        contactPhone,
        contactEmail,
        taxId,
        notes,
      } = req.body;

      // Check if client with email already exists
      const existingClient = await this.clientRepository.findOne({
        where: { email },
      });

      if (existingClient) {
        res.status(400).json({
          success: false,
          message: 'Client with this email already exists',
        });
        return;
      }

      // Create new client
      const client = this.clientRepository.create({
        name,
        email,
        phone,
        address,
        city,
        state,
        postalCode,
        country,
        contactPerson,
        contactTitle,
        contactPhone,
        contactEmail,
        taxId,
        notes,
        isActive: true,
      });

      // Validate client data
      const errors = await validate(client);
      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.map(error => ({
            property: error.property,
            constraints: error.constraints,
          })),
        });
        return;
      }

      // Save client
      const savedClient = await this.clientRepository.save(client);

      res.status(201).json({
        success: true,
        message: 'Client created successfully',
        data: savedClient.toJSON(),
      });
    } catch (error) {
      console.error('Error creating client:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get all clients
  async getAllClients(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search, isActive } = req.query;

      const queryBuilder = this.clientRepository.createQueryBuilder('client');

      // Apply filters
      if (search) {
        queryBuilder.where(
          'client.name ILIKE :search OR client.email ILIKE :search OR client.contactPerson ILIKE :search',
          { search: `%${search}%` }
        );
      }

      if (isActive !== undefined) {
        queryBuilder.andWhere('client.isActive = :isActive', { isActive: isActive === 'true' });
      }

      // Apply pagination
      const pageNumber = Math.max(1, parseInt(page as string, 10));
      const limitNumber = Math.min(100, Math.max(1, parseInt(limit as string, 10)));

      queryBuilder
        .orderBy('client.name', 'ASC')
        .skip((pageNumber - 1) * limitNumber)
        .take(limitNumber);

      const [clients, total] = await queryBuilder.getManyAndCount();

      res.status(200).json({
        success: true,
        data: clients.map(client => client.toJSON()),
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(total / limitNumber),
        },
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get client by ID
  async getClientById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const client = await this.clientRepository.findOne({
        where: { id },
      });

      if (!client) {
        res.status(404).json({
          success: false,
          message: 'Client not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: client.toJSON(),
      });
    } catch (error) {
      console.error('Error fetching client:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Update client
  async updateClient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const client = await this.clientRepository.findOne({
        where: { id },
      });

      if (!client) {
        res.status(404).json({
          success: false,
          message: 'Client not found',
        });
        return;
      }

      // Check if email is being updated and if it conflicts with another client
      if (updateData.email && updateData.email !== client.email) {
        const existingClient = await this.clientRepository.findOne({
          where: { email: updateData.email },
        });

        if (existingClient) {
          res.status(400).json({
            success: false,
            message: 'Client with this email already exists',
          });
          return;
        }
      }

      // Update client properties
      Object.assign(client, updateData);

      // Validate updated client data
      const errors = await validate(client);
      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.map(error => ({
            property: error.property,
            constraints: error.constraints,
          })),
        });
        return;
      }

      const updatedClient = await this.clientRepository.save(client);

      res.status(200).json({
        success: true,
        message: 'Client updated successfully',
        data: updatedClient.toJSON(),
      });
    } catch (error) {
      console.error('Error updating client:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Delete client (soft delete)
  async deleteClient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const client = await this.clientRepository.findOne({
        where: { id },
      });

      if (!client) {
        res.status(404).json({
          success: false,
          message: 'Client not found',
        });
        return;
      }

      // Soft delete by setting isActive to false
      client.isActive = false;
      await this.clientRepository.save(client);

      res.status(200).json({
        success: true,
        message: 'Client deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Restore deleted client
  async restoreClient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const client = await this.clientRepository.findOne({
        where: { id },
      });

      if (!client) {
        res.status(404).json({
          success: false,
          message: 'Client not found',
        });
        return;
      }

      client.isActive = true;
      await this.clientRepository.save(client);

      res.status(200).json({
        success: true,
        message: 'Client restored successfully',
        data: client.toJSON(),
      });
    } catch (error) {
      console.error('Error restoring client:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}