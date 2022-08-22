import { TodosAccess } from '../data/todosAcess'
import { AttachmentUtils } from '../helpers/attachmentUtils'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import * as createError from 'http-errors'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

// TODO: Implement businessLogic

const todosAccess = new TodosAccess()
const attachmentUtils = new AttachmentUtils()
const logger = createLogger('todos')

export const getAllTodos = (userId: string): Promise<TodoItem[]> => {
  logger.info('Get all todos')

  return todosAccess.getAllTodos(userId)
}

export const createTodo = async (
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> => {
  const todoId = uuid.v4()
  const createdAt = new Date().toISOString()

  const todoItem = {
    todoId,
    userId,
    createdAt,
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false,
    attachmentUrl: await attachmentUtils.getUploadUrl(todoId)
  }

  try {
    return await todosAccess.createTodo(todoItem)
  } catch (error) {
    logger.error('Error creating todo', { error })
    throw new createError.InternalServerError(error)
  }
}

export const updateTodo = (
  todoId: string,
  updateTodoRequest: UpdateTodoRequest,
  userId: string
): Promise<TodoItem> => {
  const todoUpdate = {
    name: updateTodoRequest.name,
    dueDate: updateTodoRequest.dueDate,
    done: updateTodoRequest.done
  }

  return todosAccess.updateTodo(todoId, todoUpdate, userId)
}

export const deleteTodo = (
  todoId: string,
  userId: string
): Promise<DocumentClient.DeleteItemOutput> => {
  return todosAccess.deleteTodo(todoId, userId)
}

export const getAttachmentUrl = (todoId: string): Promise<string> => {
  return attachmentUtils.getUploadUrl(todoId)
}
