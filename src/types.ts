export interface TurboConfig {
  pipeline: Record<string, PipelineTask>;
  globalDependencies?: string[];
}

export interface PipelineTask {
  dependsOn?: string[];
  outputs?: string[];
  cache?: boolean;
  inputs?: string[];
}

export interface TaskExecution {
  task: string;
  workspace: string;
  command: string;
  hash: string;
}
