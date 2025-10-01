import Joi from 'joi';
import { isValidStudentEmail, isValidAdminEmail } from '../middleware/auth.js';

// Common validation schemas
export const emailSchema = Joi.string()
  .email()
  .required()
  .custom((value, helpers) => {
    if (!isValidStudentEmail(value) && !isValidAdminEmail(value)) {
      return helpers.error('email.domain');
    }
    return value;
  })
  .messages({
    'email.domain': 'Email must be from @student.tce.edu or @tce.edu domain',
  });

export const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])'))
  .required()
  .messages({
    'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
  });

export const rollNumberSchema = Joi.string()
  .pattern(/^([0-9]{6}|[0-9]{2}[A-Z]{2}[0-9]{3})$/)
  .required()
  .messages({
    'string.pattern.base': 'Roll number must be either 6 digits (e.g., 660523) or format like 67IT001',
  });

export const registerNumberSchema = Joi.string()
  .pattern(/^[0-9]{16}$/)
  .required()
  .messages({
    'string.pattern.base': 'Register number must be exactly 16 digits',
  });

export const departmentSchema = Joi.string()
  .valid(
    'Computer Science and Engineering',
    'Information Technology',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Artificial Intelligence and Data Science',
    'Cyber Security',
    'Biotechnology',
    'Chemical Engineering'
  )
  .required();

export const yearSchema = Joi.number()
  .integer()
  .min(1)
  .max(4)
  .required();

export const phoneNumberSchema = Joi.string()
  .pattern(/^[+]?[1-9]?[0-9]{7,15}$/)
  .messages({
    'string.pattern.base': 'Phone number must be a valid format (7-15 digits)',
  });

// Auth validation schemas
export const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().required(),
});

export const registerSchema = Joi.object({
  email: emailSchema.custom((value, helpers) => {
    if (!isValidStudentEmail(value)) {
      return helpers.error('email.student');
    }
    return value;
  }).messages({
    'email.student': 'Registration is only allowed for students with @student.tce.edu email',
  }),
  password: passwordSchema,
  name: Joi.string().min(2).max(100).required(),
  department: departmentSchema,
  year: yearSchema,
  rollNumber: rollNumberSchema,
  registerNumber: registerNumberSchema,
  phoneNumber: phoneNumberSchema.optional(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: passwordSchema,
});

export const forgotPasswordSchema = Joi.object({
  email: emailSchema,
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: passwordSchema,
});

// Profile update schema
export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  department: departmentSchema.optional(),
  year: yearSchema.optional(),
  phoneNumber: phoneNumberSchema.optional(),
  profilePicture: Joi.string().uri().optional(),
}).min(1); // At least one field must be provided

// Hackathon validation schemas
export const createHackathonSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(5000).required(),
  startDate: Joi.date().greater('now').required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  registrationDeadline: Joi.date().less(Joi.ref('startDate')).required(),
  maxTeamSize: Joi.number().integer().min(1).max(10).required(),
  minTeamSize: Joi.number().integer().min(1).max(Joi.ref('maxTeamSize')).required(),
  tags: Joi.array().items(Joi.string().min(2).max(50)).min(1).max(10).required(),
  prizeMoney: Joi.number().positive().optional(),
  location: Joi.string().max(200).optional(),
  requirements: Joi.array().items(Joi.string().max(500)).optional(),
  category: Joi.string().max(100).required(),
  difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
});

export const updateHackathonSchema = Joi.object({
  title: Joi.string().min(5).max(200).optional(),
  description: Joi.string().min(10).max(5000).optional(),
  startDate: Joi.date().greater('now').optional(),
  endDate: Joi.date().optional(),
  registrationDeadline: Joi.date().optional(),
  maxTeamSize: Joi.number().integer().min(1).max(10).optional(),
  minTeamSize: Joi.number().integer().min(1).optional(),
  tags: Joi.array().items(Joi.string().min(2).max(50)).min(1).max(10).optional(),
  prizeMoney: Joi.number().positive().optional(),
  location: Joi.string().max(200).optional(),
  requirements: Joi.array().items(Joi.string().max(500)).optional(),
  category: Joi.string().max(100).optional(),
  difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
  status: Joi.string().valid('upcoming', 'ongoing', 'completed', 'archived').optional(),
}).min(1);

// Registration validation schemas
export const createRegistrationSchema = Joi.object({
  hackathonId: Joi.string().required(),
  teamName: Joi.string().min(2).max(100).optional(),
  teamMembers: Joi.array().items(Joi.object({
    email: emailSchema.custom((value, helpers) => {
      if (!isValidStudentEmail(value)) {
        return helpers.error('email.student');
      }
      return value;
    }),
    name: Joi.string().min(2).max(100).required(),
    rollNumber: rollNumberSchema,
    department: departmentSchema,
    year: yearSchema,
  })).min(0).max(9).optional(),
});

export const updateRegistrationStatusSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected', 'waitlisted').required(),
  feedback: Joi.string().max(1000).optional(),
});

// Post-event submission validation
export const createSubmissionSchema = Joi.object({
  registrationId: Joi.string().required(),
  projectLinks: Joi.array().items(Joi.string().uri()).min(0).max(5).required(),
  repoUrl: Joi.string().uri().optional(),
  demoUrl: Joi.string().uri().optional(),
  description: Joi.string().min(10).max(2000).required(),
  achievements: Joi.array().items(Joi.object({
    type: Joi.string().valid('winner', 'runner_up', 'third_place', 'top_10', 'participation', 'special_recognition').required(),
    title: Joi.string().max(200).required(),
    description: Joi.string().max(500).optional(),
  })).min(1).max(5).required(),
});

// Pagination and filtering schemas
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const filterSchema = Joi.object({
  dateRange: Joi.object({
    start: Joi.date(),
    end: Joi.date().greater(Joi.ref('start')),
  }).optional(),
  month: Joi.string().pattern(/^\d{4}-\d{2}$/).optional(), // YYYY-MM format
  academicYear: Joi.string().pattern(/^\d{4}-\d{4}$/).optional(), // YYYY-YYYY format
  student: Joi.string().optional(),
  status: Joi.array().items(Joi.string()).optional(),
  department: departmentSchema.optional(),
  category: Joi.array().items(Joi.string()).optional(),
  year: Joi.array().items(yearSchema).optional(),
});

// File upload validation
export const fileUploadSchema = Joi.object({
  fieldname: Joi.string().required(),
  originalname: Joi.string().required(),
  encoding: Joi.string().required(),
  mimetype: Joi.string().valid(
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ).required(),
  size: Joi.number().max(10 * 1024 * 1024).required(), // 10MB max
});

// Notification schema
export const createNotificationSchema = Joi.object({
  userId: Joi.string().required(),
  title: Joi.string().min(5).max(200).required(),
  message: Joi.string().min(10).max(1000).required(),
  type: Joi.string().valid('info', 'success', 'warning', 'error', 'achievement').required(),
  actionUrl: Joi.string().uri().optional(),
});

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    req.body = value;
    next();
  };
};

// Query validation middleware
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        error: 'Query validation failed',
        details: errors,
      });
    }

    req.query = value;
    next();
  };
};
