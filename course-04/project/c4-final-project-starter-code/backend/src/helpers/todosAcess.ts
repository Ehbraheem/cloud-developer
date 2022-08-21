import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE
  ) {}

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    logger.info('Getting all todos')

    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        IndexName: process.env.TODOS_CREATED_AT_INDEX,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    logger.info('Creating todo', { todoItem })

    await this.docClient
      .put({
        TableName: this.todosTable,
        Item: todoItem
      })
      .promise()

    return todoItem
  }

  async updateTodo(todoId: string, todoUpdate: TodoUpdate): Promise<TodoItem> {
    logger.info('Updating todo', todoUpdate)

    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          todoId: todoId
        },
        UpdateExpression: 'set #name = :name, done = :done',
        ExpressionAttributeValues: {
          ':name': todoUpdate.name,
          ':done': todoUpdate.done
        },
        ExpressionAttributeNames: {
          '#name': 'name'
        }
      })
      .promise()

    return await this.getTodoById(todoId)
  }

  async deleteTodo(todoId: string): Promise<TodoItem> {
    logger.info('Deleting todo', { todoId })

    await this.docClient
      .delete({
        TableName: this.todosTable,
        Key: {
          todoId: todoId
        }
      })
      .promise()

    return await this.getTodoById(todoId)
  }

  async getTodoById(todoId: string): Promise<TodoItem> {
    logger.info('Getting todo', { todoId })

    const result = await this.docClient
      .get({
        TableName: this.todosTable,
        Key: {
          todoId: todoId
        }
      })
      .promise()

    return result.Item as TodoItem
  }
}

const createDynamoDBClient = () => {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}
