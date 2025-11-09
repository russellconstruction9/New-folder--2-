/**
 * Error Handling Utilities
 * Provides centralized error handling and user feedback
 */

import { ApiError } from './apiService';

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
  userMessage: string;
}

export interface ErrorHandlerOptions {
  showToast?: (message: string, type: 'error' | 'warning' | 'info') => void;
  logError?: (error: AppError) => void;
  redirectOnAuth?: boolean;
}

class ErrorHandler {
  private options: ErrorHandlerOptions;

  constructor(options: ErrorHandlerOptions = {}) {
    this.options = {
      redirectOnAuth: true,
      ...options
    };
  }

  public handleError(error: any, context?: string): AppError {
    const appError = this.createAppError(error, context);
    
    // Log the error
    this.logError(appError);
    
    // Show user feedback
    this.showUserFeedback(appError);
    
    // Handle special cases
    this.handleSpecialCases(appError);
    
    return appError;
  }

  private createAppError(error: any, context?: string): AppError {
    const timestamp = new Date();
    let appError: AppError;

    if (this.isApiError(error)) {
      appError = this.createApiError(error, timestamp, context);
    } else if (error instanceof Error) {
      appError = this.createGenericError(error, timestamp, context);
    } else if (typeof error === 'string') {
      appError = this.createStringError(error, timestamp, context);
    } else {
      appError = this.createUnknownError(error, timestamp, context);
    }

    return appError;
  }

  private isApiError(error: any): error is ApiError {
    return error && typeof error.status === 'number' && typeof error.message === 'string';
  }

  private createApiError(error: ApiError, timestamp: Date, context?: string): AppError {
    let type: ErrorType;
    let userMessage: string;

    switch (error.status) {
      case 400:
        type = ErrorType.VALIDATION;
        userMessage = 'Please check your input and try again.';
        break;
      case 401:
        type = ErrorType.AUTHENTICATION;
        userMessage = 'Please log in to continue.';
        break;
      case 403:
        type = ErrorType.AUTHORIZATION;
        userMessage = 'You don\'t have permission to perform this action.';
        break;
      case 404:
        type = ErrorType.NOT_FOUND;
        userMessage = 'The requested resource was not found.';
        break;
      case 429:
        type = ErrorType.CLIENT;
        userMessage = 'Too many requests. Please try again later.';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        type = ErrorType.SERVER;
        userMessage = 'Server error. Please try again later.';
        break;
      default:
        if (error.status >= 400 && error.status < 500) {
          type = ErrorType.CLIENT;
          userMessage = 'There was a problem with your request.';
        } else {
          type = ErrorType.SERVER;
          userMessage = 'Something went wrong. Please try again.';
        }
    }

    return {
      type,
      message: error.message,
      details: { status: error.status, code: error.code, context },
      timestamp,
      userMessage
    };
  }

  private createGenericError(error: Error, timestamp: Date, context?: string): AppError {
    let type: ErrorType;
    let userMessage: string;

    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      type = ErrorType.CLIENT;
      userMessage = 'Something went wrong. Please refresh the page and try again.';
    } else if (error.message.includes('fetch') || error.message.includes('network')) {
      type = ErrorType.NETWORK;
      userMessage = 'Network error. Please check your connection and try again.';
    } else {
      type = ErrorType.UNKNOWN;
      userMessage = 'An unexpected error occurred. Please try again.';
    }

    return {
      type,
      message: error.message,
      details: { name: error.name, stack: error.stack, context },
      timestamp,
      userMessage
    };
  }

  private createStringError(error: string, timestamp: Date, context?: string): AppError {
    return {
      type: ErrorType.UNKNOWN,
      message: error,
      details: { context },
      timestamp,
      userMessage: error
    };
  }

  private createUnknownError(error: any, timestamp: Date, context?: string): AppError {
    return {
      type: ErrorType.UNKNOWN,
      message: 'Unknown error occurred',
      details: { error, context },
      timestamp,
      userMessage: 'An unexpected error occurred. Please try again.'
    };
  }

  private logError(error: AppError): void {
    const logLevel = this.getLogLevel(error.type);
    
    console.group(`🚨 ${error.type} Error`);
    console[logLevel]('Message:', error.message);
    console[logLevel]('User Message:', error.userMessage);
    console[logLevel]('Timestamp:', error.timestamp.toISOString());
    
    if (error.details) {
      console[logLevel]('Details:', error.details);
    }
    
    console.groupEnd();

    // Custom logging function
    if (this.options.logError) {
      this.options.logError(error);
    }
  }

  private getLogLevel(type: ErrorType): 'error' | 'warn' | 'info' {
    switch (type) {
      case ErrorType.SERVER:
      case ErrorType.UNKNOWN:
        return 'error';
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
      case ErrorType.NOT_FOUND:
        return 'warn';
      default:
        return 'info';
    }
  }

  private showUserFeedback(error: AppError): void {
    if (this.options.showToast) {
      const toastType = this.getToastType(error.type);
      this.options.showToast(error.userMessage, toastType);
    }
  }

  private getToastType(type: ErrorType): 'error' | 'warning' | 'info' {
    switch (type) {
      case ErrorType.SERVER:
      case ErrorType.UNKNOWN:
        return 'error';
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
      case ErrorType.VALIDATION:
        return 'warning';
      default:
        return 'info';
    }
  }

  private handleSpecialCases(error: AppError): void {
    switch (error.type) {
      case ErrorType.AUTHENTICATION:
        if (this.options.redirectOnAuth) {
          // Clear local storage
          localStorage.removeItem('auth_token');
          // Redirect to login
          window.location.href = '/login';
        }
        break;
        
      case ErrorType.NETWORK:
        // You might want to queue failed requests for retry
        this.handleNetworkError(error);
        break;
        
      case ErrorType.SERVER:
        // You might want to retry the request
        this.handleServerError(error);
        break;
    }
  }

  private handleNetworkError(error: AppError): void {
    // Implement network error handling (e.g., retry queue)
    console.warn('Network error detected. Consider implementing retry logic.');
  }

  private handleServerError(error: AppError): void {
    // Implement server error handling (e.g., automatic retry)
    console.warn('Server error detected. Consider implementing retry logic.');
  }
}

// Async error handler for promises
export const handleAsyncError = (errorHandler: ErrorHandler) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        errorHandler.handleError(error, `${target.constructor.name}.${propertyKey}`);
        throw error;
      }
    };

    return descriptor;
  };
};

// Create singleton instance
export const errorHandler = new ErrorHandler();

// Convenience functions
export const handleError = (error: any, context?: string): AppError => {
  return errorHandler.handleError(error, context);
};

export const createErrorHandler = (options: ErrorHandlerOptions): ErrorHandler => {
  return new ErrorHandler(options);
};

export default errorHandler;