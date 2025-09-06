

// src/api/hello/hello.v1.controller.ts


// Import necessary types from Express for request and response handling
import { Request, Response } from 'express';

/**
 * Handles GET requests to return a simple "Hello World" message
 */
export const getHelloWorld = (req: Request, res: Response): void => {
  try {
    // Send a successful JSON response with status code 200 (OK)
    res.status(200).json({
      success: true,        // Indicates the request was processed successfully
      message: 'Hello World!', // The main greeting message
      timestamp: new Date().toISOString() // Current time in ISO format for reference
    });
    
  } catch (error) {
    // Handle any unexpected errors that might occur during processing
    res.status(500).json({
      success: false,       // Indicates the request failed
      message: 'Internal server error' // Generic error message for client
    });
  }
};