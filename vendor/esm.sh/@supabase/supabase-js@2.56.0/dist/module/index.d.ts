import SupabaseClient from './SupabaseClient.d.ts';
import type { SupabaseClientOptions } from './lib/types.d.ts';
export * from 'https://esm.sh/@supabase/auth-js@2.71.1/dist/module/index.d.ts';
export type { User as AuthUser, Session as AuthSession } from 'https://esm.sh/@supabase/auth-js@2.71.1/dist/module/index.d.ts';
export { type PostgrestResponse, type PostgrestSingleResponse, type PostgrestMaybeSingleResponse, PostgrestError, } from 'https://esm.sh/@supabase/postgrest-js@1.21.3/dist/cjs/index.d.ts';
export { FunctionsHttpError, FunctionsFetchError, FunctionsRelayError, FunctionsError, type FunctionInvokeOptions, FunctionRegion, } from 'https://esm.sh/@supabase/functions-js@2.4.5/dist/module/index.d.ts';
export * from 'https://esm.sh/@supabase/realtime-js@2.15.1/dist/module/index.d.ts';
export { default as SupabaseClient } from './SupabaseClient.d.ts';
export type { SupabaseClientOptions, QueryResult, QueryData, QueryError } from './lib/types.d.ts';
/**
 * Creates a new Supabase Client.
 */
export declare const createClient: <Database = any, SchemaNameOrClientOptions extends (string & Exclude<keyof Database, "__InternalSupabase">) | {
    PostgrestVersion: string;
} = "public" extends Exclude<keyof Database, "__InternalSupabase"> ? "public" : string & Exclude<keyof Database, "__InternalSupabase">, SchemaName extends string & Exclude<keyof Database, "__InternalSupabase"> = SchemaNameOrClientOptions extends string & Exclude<keyof Database, "__InternalSupabase"> ? SchemaNameOrClientOptions : "public" extends Exclude<keyof Database, "__InternalSupabase"> ? "public" : string & Exclude<Exclude<keyof Database, "__InternalSupabase">, "__InternalSupabase">>(supabaseUrl: string, supabaseKey: string, options?: SupabaseClientOptions<SchemaName> | undefined) => SupabaseClient<Database, SchemaNameOrClientOptions, SchemaName, Omit<Database, "__InternalSupabase">[SchemaName] extends import("./lib/types.d.ts").GenericSchema ? Omit<Database, "__InternalSupabase">[SchemaName] : never, SchemaNameOrClientOptions extends string & Exclude<keyof Database, "__InternalSupabase"> ? Database extends {
    __InternalSupabase: {
        PostgrestVersion: string;
    };
} ? Database["__InternalSupabase"] : {
    PostgrestVersion: "12";
} : SchemaNameOrClientOptions extends {
    PostgrestVersion: string;
} ? SchemaNameOrClientOptions : never>;
//# sourceMappingURL=index.d.ts.map
