

// src/api/hello/hello.v1.controller.ts


// Import necessary types from Express for request and response handling
import { Request, Response } from 'express';

/**
 * Handles GET requests to return a simple "Hello World" message
 * 
 * This file defines the getHelloWorld controller. It receives 
 * a request and sends back a JSON response with a message, a 
 * success flag, and a timestamp. I also added error handling 
 * so the API always responds gracefully.
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