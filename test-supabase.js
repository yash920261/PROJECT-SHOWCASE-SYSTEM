const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSubmit() {
  console.log("Testing Group Creation");
  const { data, error } = await supabase
    .from('groups')
    .insert({
      name: 'TestGroup',
      leader_email: 'test@college.edu',
      student_key: 'ASDFGH'
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating group:", error);
  } else {
    console.log("Group created successfully:", data);
  }
}

testSubmit();
