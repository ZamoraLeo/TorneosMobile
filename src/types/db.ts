import type { Database, Json } from './supabase'

export type Db = Database
export type DbJson = Json

export type DbTable<K extends keyof Db['public']['Tables']> =
  Db['public']['Tables'][K]

export type DbRow<K extends keyof Db['public']['Tables']> =
  DbTable<K>['Row']

export type DbInsert<K extends keyof Db['public']['Tables']> =
  DbTable<K>['Insert']

export type DbUpdate<K extends keyof Db['public']['Tables']> =
  DbTable<K>['Update']

export type DbViewRow<K extends keyof Db['public']['Views']> =
  Db['public']['Views'][K]['Row']

export type DbEnum<K extends keyof Db['public']['Enums']> =
  Db['public']['Enums'][K]
