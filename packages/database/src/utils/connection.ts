import mongoose from "mongoose";

interface ConnectionOptions {
  uri: string;
  options?: mongoose.ConnectOptions;
}

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  async connect(options: ConnectionOptions): Promise<void> {
    if (this.isConnected) {
      console.log("Database already connected");
      return;
    }

    try {
      const defaultOptions: mongoose.ConnectOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: true, // 启用命令缓冲，避免连接未完成时的查询错误
        ...options.options,
      };

      await mongoose.connect(options.uri, defaultOptions);
      this.isConnected = true;
      console.log("Database connected successfully");

      // 监听连接事件
      mongoose.connection.on("error", (error) => {
        console.error("Database connection error:", error);
        this.isConnected = false;
      });

      mongoose.connection.on("disconnected", () => {
        console.log("Database disconnected");
        this.isConnected = false;
      });

      mongoose.connection.on("reconnected", () => {
        console.log("Database reconnected");
        this.isConnected = true;
      });
    } catch (error) {
      console.error("Failed to connect to database:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log("Database disconnected successfully");
    } catch (error) {
      console.error("Failed to disconnect from database:", error);
      throw error;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) return false;

      // 执行简单的ping操作
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      }
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }
}

// 导出单例实例
export const dbConnection = DatabaseConnection.getInstance();

// 便捷函数
export async function connectDatabase(uri?: string): Promise<void> {
  // 在构建时跳过数据库连接
  if (process.env.SKIP_DATABASE_CONNECTION === "true") {
    console.log("Skipping database connection during build");
    return;
  }

  // 如果已经连接，直接返回
  if (dbConnection.getConnectionStatus()) {
    return;
  }

  const databaseUri =
    uri ||
    process.env.DATABASE_URL ||
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017/hotornot";

  console.log(
    `🔗 Connecting to database: ${databaseUri.replace(/\/\/.*@/, "//*****@")}`,
  );

  await dbConnection.connect({
    uri: databaseUri,
    options: {
      dbName: "hotornot",
    },
  });

  // 等待连接完全建立
  await new Promise((resolve) => {
    if (mongoose.connection.readyState === 1) {
      resolve(true);
    } else {
      mongoose.connection.once("connected", resolve);
    }
  });

  console.log("✅ Database connection established and ready");
}

export async function disconnectDatabase(): Promise<void> {
  await dbConnection.disconnect();
}

export function isDatabaseConnected(): boolean {
  return dbConnection.getConnectionStatus();
}

export async function checkDatabaseHealth(): Promise<boolean> {
  // 在构建时跳过健康检查
  if (process.env.SKIP_DATABASE_CONNECTION === "true") {
    console.log("Skipping database health check during build");
    return false;
  }

  return dbConnection.healthCheck();
}
