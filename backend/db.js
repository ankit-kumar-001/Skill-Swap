import dotenv from 'dotenv';
import {Pool} from 'pg';

dotenv.config();
const dburl = process.env.DATABASE_URL;

const pgl = new Pool({
    connectionString: dburl
});

export default pgl;