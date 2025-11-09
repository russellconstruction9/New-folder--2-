/**
 * Data Validation Utilities
 * Provides validation functions for all data types in the application
 */

import { ProjectType, TaskStatus, InvoiceStatus } from '../types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Basic validation functions
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const isValidCurrency = (amount: number): boolean => {
  return typeof amount === 'number' && amount >= 0 && isFinite(amount);
};

// User validation
export const validateUser = (user: any): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!user.name || typeof user.name !== 'string' || user.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
  }

  if (!user.email || !isValidEmail(user.email)) {
    errors.push({ field: 'email', message: 'Valid email address is required' });
  }

  if (!user.role || typeof user.role !== 'string' || user.role.trim().length < 2) {
    errors.push({ field: 'role', message: 'Role is required' });
  }

  if (user.hourlyRate !== undefined && (!isValidCurrency(user.hourlyRate) || user.hourlyRate <= 0)) {
    errors.push({ field: 'hourlyRate', message: 'Hourly rate must be a positive number' });
  }

  if (user.phone && !isValidPhone(user.phone)) {
    errors.push({ field: 'phone', message: 'Invalid phone number format' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Project validation
export const validateProject = (project: any): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!project.name || typeof project.name !== 'string' || project.name.trim().length < 3) {
    errors.push({ field: 'name', message: 'Project name must be at least 3 characters long' });
  }

  if (!project.address || typeof project.address !== 'string' || project.address.trim().length < 10) {
    errors.push({ field: 'address', message: 'Valid address is required (minimum 10 characters)' });
  }

  if (!project.type || !Object.values(ProjectType).includes(project.type)) {
    errors.push({ field: 'type', message: 'Valid project type is required' });
  }

  if (!project.status || !['In Progress', 'Completed', 'On Hold'].includes(project.status)) {
    errors.push({ field: 'status', message: 'Valid project status is required' });
  }

  if (!isValidDate(new Date(project.startDate))) {
    errors.push({ field: 'startDate', message: 'Valid start date is required' });
  }

  if (!isValidDate(new Date(project.endDate))) {
    errors.push({ field: 'endDate', message: 'Valid end date is required' });
  }

  if (project.startDate && project.endDate && new Date(project.startDate) > new Date(project.endDate)) {
    errors.push({ field: 'endDate', message: 'End date must be after start date' });
  }

  if (!isValidCurrency(project.budget) || project.budget <= 0) {
    errors.push({ field: 'budget', message: 'Budget must be a positive number' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Task validation
export const validateTask = (task: any): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!task.title || typeof task.title !== 'string' || task.title.trim().length < 3) {
    errors.push({ field: 'title', message: 'Task title must be at least 3 characters long' });
  }

  if (task.description && typeof task.description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be a string' });
  }

  if (!task.projectId || typeof task.projectId !== 'number' || task.projectId <= 0) {
    errors.push({ field: 'projectId', message: 'Valid project is required' });
  }

  if (!task.assigneeId || typeof task.assigneeId !== 'number' || task.assigneeId <= 0) {
    errors.push({ field: 'assigneeId', message: 'Valid assignee is required' });
  }

  if (!isValidDate(new Date(task.dueDate))) {
    errors.push({ field: 'dueDate', message: 'Valid due date is required' });
  }

  if (task.status && !Object.values(TaskStatus).includes(task.status)) {
    errors.push({ field: 'status', message: 'Valid task status is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Inventory item validation
export const validateInventoryItem = (item: any): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!item.name || typeof item.name !== 'string' || item.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Item name must be at least 2 characters long' });
  }

  if (typeof item.quantity !== 'number' || item.quantity < 0) {
    errors.push({ field: 'quantity', message: 'Quantity must be a non-negative number' });
  }

  if (!item.unit || typeof item.unit !== 'string' || item.unit.trim().length < 1) {
    errors.push({ field: 'unit', message: 'Unit is required' });
  }

  if (item.cost !== undefined && !isValidCurrency(item.cost)) {
    errors.push({ field: 'cost', message: 'Cost must be a valid positive number' });
  }

  if (item.lowStockThreshold !== undefined && (typeof item.lowStockThreshold !== 'number' || item.lowStockThreshold < 0)) {
    errors.push({ field: 'lowStockThreshold', message: 'Low stock threshold must be a non-negative number' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Invoice validation
export const validateInvoice = (invoice: any): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!invoice.invoiceNumber || typeof invoice.invoiceNumber !== 'string' || invoice.invoiceNumber.trim().length < 3) {
    errors.push({ field: 'invoiceNumber', message: 'Invoice number is required (minimum 3 characters)' });
  }

  if (!invoice.projectId || typeof invoice.projectId !== 'number' || invoice.projectId <= 0) {
    errors.push({ field: 'projectId', message: 'Valid project is required' });
  }

  if (!isValidDate(new Date(invoice.dateIssued))) {
    errors.push({ field: 'dateIssued', message: 'Valid issue date is required' });
  }

  if (!isValidDate(new Date(invoice.dueDate))) {
    errors.push({ field: 'dueDate', message: 'Valid due date is required' });
  }

  if (invoice.dateIssued && invoice.dueDate && new Date(invoice.dateIssued) > new Date(invoice.dueDate)) {
    errors.push({ field: 'dueDate', message: 'Due date must be after issue date' });
  }

  if (!invoice.status || !Object.values(InvoiceStatus).includes(invoice.status)) {
    errors.push({ field: 'status', message: 'Valid invoice status is required' });
  }

  if (!Array.isArray(invoice.lineItems) || invoice.lineItems.length === 0) {
    errors.push({ field: 'lineItems', message: 'At least one line item is required' });
  } else {
    invoice.lineItems.forEach((item: any, index: number) => {
      if (!item.description || typeof item.description !== 'string' || item.description.trim().length < 3) {
        errors.push({ field: `lineItems[${index}].description`, message: 'Line item description is required' });
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors.push({ field: `lineItems[${index}].quantity`, message: 'Line item quantity must be positive' });
      }
      if (typeof item.rate !== 'number' || item.rate <= 0) {
        errors.push({ field: `lineItems[${index}].rate`, message: 'Line item rate must be positive' });
      }
    });
  }

  if (!isValidCurrency(invoice.subtotal)) {
    errors.push({ field: 'subtotal', message: 'Subtotal must be a valid positive number' });
  }

  if (typeof invoice.taxRate !== 'number' || invoice.taxRate < 0 || invoice.taxRate > 100) {
    errors.push({ field: 'taxRate', message: 'Tax rate must be between 0 and 100' });
  }

  if (!isValidCurrency(invoice.total)) {
    errors.push({ field: 'total', message: 'Total must be a valid positive number' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// File validation
export const validateFile = (file: File, maxSize: number = 10485760, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!file) {
    errors.push({ field: 'file', message: 'File is required' });
    return { isValid: false, errors };
  }

  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    errors.push({ field: 'file', message: `File size must be less than ${maxMB}MB` });
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push({ field: 'file', message: `File type must be one of: ${allowedTypes.join(', ')}` });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!password || password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one lowercase letter' });
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter' });
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one number' });
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one special character' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generic form validation
export const validateForm = (data: any, validators: Record<string, (value: any) => ValidationResult>): ValidationResult => {
  const allErrors: ValidationError[] = [];

  Object.entries(validators).forEach(([field, validator]) => {
    const result = validator(data[field]);
    if (!result.isValid) {
      allErrors.push(...result.errors);
    }
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
};

// Sanitization functions
export const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
};

export const sanitizeNumber = (num: any): number => {
  const parsed = typeof num === 'string' ? parseFloat(num) : num;
  return isNaN(parsed) ? 0 : parsed;
};

export const sanitizeInteger = (num: any): number => {
  const parsed = typeof num === 'string' ? parseInt(num, 10) : num;
  return isNaN(parsed) ? 0 : parsed;
};

export default {
  validateUser,
  validateProject,
  validateTask,
  validateInventoryItem,
  validateInvoice,
  validateFile,
  validatePassword,
  validateForm,
  sanitizeString,
  sanitizeNumber,
  sanitizeInteger,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  isValidDate,
  isValidCurrency
};