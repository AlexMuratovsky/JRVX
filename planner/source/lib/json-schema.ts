import { toJsonSchemaCompat } from "@modelcontextprotocol/sdk/server/zod-json-schema-compat.js";
import { z } from "zod";
/** Inline local references so a schema can be embedded in OpenAPI or a tool. */
export function jsonSchema(schema:z.AnyZodObject):Record<string,any> {
  const root=toJsonSchemaCompat(schema,{target:"jsonSchema7"});
  function visit(value:any):any {
    if(Array.isArray(value))return value.map(visit);
    if(!value||typeof value!=="object")return value;
    if(typeof value.$ref==="string"&&value.$ref.startsWith("#/")) {
      const target=value.$ref.slice(2).split("/").reduce((v:any,k:string)=>v[k.replace(/~1/g,"/").replace(/~0/g,"~")],root);
      return visit(target);
    }
    return Object.fromEntries(Object.entries(value).filter(([k])=>k!=="$schema").map(([k,v])=>[k,visit(v)]));
  }
  return visit(root);
}
