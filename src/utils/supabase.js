// Supabase 配置文件
import { createClient } from '@supabase/supabase-js'

// 从环境变量获取配置
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabaseClient = null

export const initSupabase = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase 配置未找到，请在 .env.local 中配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
    return false
  }

  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    console.log('Supabase 初始化成功')
    return true
  } catch (error) {
    console.error('Supabase 初始化失败:', error)
    return false
  }
}

export const getSupabase = () => {
  return supabaseClient
}

// 数据表操作
export const queryAll = async (tableName) => {
  const { data, error } = await supabaseClient
    .from(tableName)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const queryById = async (tableName, id) => {
  const { data, error } = await supabaseClient
    .from(tableName)
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export const createRecord = async (tableName, record) => {
  const { data, error } = await supabaseClient
    .from(tableName)
    .insert(record)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateRecord = async (tableName, id, updates) => {
  const { data, error } = await supabaseClient
    .from(tableName)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteRecord = async (tableName, id) => {
  const { error } = await supabaseClient
    .from(tableName)
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export default supabaseClient
