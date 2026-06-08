import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qfdatjdihbnjdmdwcspt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZGF0amRpaGJuamRtZHdjc3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MjAyMzIsImV4cCI6MjA5NjQ5NjIzMn0.s-aQC0lwJ4I4xBpPw4_Gul5m3x1Rxv2z7LS1TxUC-hA'

export const supabase = createClient(supabaseUrl, supabaseKey)