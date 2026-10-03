import { describe, expect, it } from 'vitest';
import { parseJson } from '../../../src/tools/json-formatter/features/json';
import { DEFAULT_OPTIONS, generateCode, type CodeOptions } from '../../../src/tools/json-to-code/features/json-to-code';

const SAMPLE = `{
  "id": 42,
  "name": "Zykit",
  "price": 9.5,
  "active": true,
  "owner": { "login": "you", "site-url": null },
  "users": [
    { "id": 1, "email": "ann@example.com", "roles": ["admin"] },
    { "id": 2, "email": null, "roles": [], "nickname": "bo" }
  ],
  "billing": { "street": "1 Main St", "zip": "10001" },
  "shipping": { "street": "2 Side St", "zip": "10002" },
  "misc": [1, "a"],
  "type": "x"
}`;

const gen = (o: Partial<CodeOptions>, text = SAMPLE) => {
  const p = parseJson(text);
  if (!p.ok) throw new Error('bad json');
  return generateCode(p.value, { ...DEFAULT_OPTIONS, ...o });
};

describe('Go', () => {
  const { code, fileName } = gen({ lang: 'go' });
  it('emits structs with json tags', () => {
    expect(fileName).toBe('models.go');
    expect(code).toContain('package main');
    expect(code).toMatch(/type Root struct \{/);
    expect(code).toMatch(/ID\s+int64\s+`json:"id"`/);
    expect(code).toMatch(/Price\s+float64\s+`json:"price"`/);
    expect(code).toMatch(/Active\s+bool\s+`json:"active"`/);
    expect(code).toMatch(/Users\s+\[\]User\s+`json:"users"`/);
    expect(code).toMatch(/Misc\s+\[\]any\s+`json:"misc"`/);
  });
  it('uses pointers for nullable and omitempty for optional', () => {
    expect(code).toMatch(/SiteURL\s+any\s+`json:"site-url"`/);
    expect(code).toMatch(/Email\s+\*string\s+`json:"email"`/);
    expect(code).toMatch(/Nickname\s+string\s+`json:"nickname,omitempty"`/);
  });
  it('shares identical shapes', () => {
    expect(code.match(/type \w+ struct/g)).toHaveLength(4);
    expect(code).toMatch(/Billing\s+Billing/);
    expect(code).toMatch(/Shipping\s+Billing/);
  });
});

describe('Python', () => {
  it('dataclasses put optional fields last', () => {
    const { code, fileName } = gen({ lang: 'python' });
    expect(fileName).toBe('models.py');
    expect(code).toContain('from dataclasses import dataclass');
    expect(code).toContain('@dataclass\nclass User:');
    expect(code).toMatch(/class User:\n {4}id: int\n {4}email: str \| None\n {4}roles: list\[str\]\n {4}nickname: str \| None = None/);
    expect(code).toContain('type: str');
    expect(code).toContain('site_url: Any  # JSON key: "site-url"');
    expect(code.indexOf('class Billing')).toBeLessThan(code.indexOf('class Root'));
  });
  it('pydantic v2 aliases renamed keys', () => {
    const { code } = gen({ lang: 'python', pyStyle: 'pydantic' });
    expect(code).toContain('from pydantic import BaseModel, ConfigDict, Field');
    expect(code).toContain('class Owner(BaseModel):');
    expect(code).toContain('model_config = ConfigDict(populate_by_name=True)');
    expect(code).toContain('site_url: Any = Field(alias="site-url")');
    expect(code).toContain('nickname: str | None = None');
  });
});

describe('Rust', () => {
  const { code, fileName } = gen({ lang: 'rust' });
  it('derives serde and uses Option', () => {
    expect(fileName).toBe('models.rs');
    expect(code).toContain('use serde::{Deserialize, Serialize};');
    expect(code).toContain('#[derive(Debug, Clone, Serialize, Deserialize)]\npub struct Root {');
    expect(code).toContain('    pub id: i64,');
    expect(code).toContain('    pub price: f64,');
    expect(code).toContain('    pub users: Vec<User>,');
    expect(code).toContain('    pub email: Option<String>,');
    expect(code).toContain('    pub misc: Vec<serde_json::Value>,');
  });
  it('renames keys and skips absent optionals', () => {
    expect(code).toContain('    #[serde(rename = "site-url")]\n    pub site_url: Option<serde_json::Value>,');
    expect(code).toContain('    #[serde(default, skip_serializing_if = "Option::is_none")]\n    pub nickname: Option<String>,');
    expect(code).toContain('pub r#type: String,');
  });
});

describe('Java', () => {
  it('records with Jackson annotations', () => {
    const { code, fileName } = gen({ lang: 'java' });
    expect(fileName).toBe('Root.java');
    expect(code).toContain('import com.fasterxml.jackson.annotation.JsonProperty;');
    expect(code).toContain('import java.util.List;');
    expect(code).toContain('public record Root(');
    expect(code).toContain('@JsonProperty("id") long id');
    expect(code).toContain('@JsonProperty("price") double price');
    expect(code).toContain('@JsonProperty("users") List<User> users');
    expect(code).toContain('@JsonProperty("nickname") String nickname');
    expect(code).toContain('@JsonProperty("site-url") Object siteUrl');
    expect(code).toMatch(/\nrecord User\(/);
  });
  it('POJOs with getters and setters', () => {
    const { code } = gen({ lang: 'java', javaStyle: 'pojo' });
    expect(code).toContain('public class Root {');
    expect(code).toContain('    @JsonProperty("active")\n    private boolean active;');
    expect(code).toContain('public boolean isActive()');
    expect(code).toContain('public void setName(String name)');
  });
});

describe('C#', () => {
  it('records with System.Text.Json attributes', () => {
    const { code, fileName } = gen({ lang: 'csharp' });
    expect(fileName).toBe('Models.cs');
    expect(code).toContain('using System.Text.Json.Serialization;');
    expect(code).toContain('public record Root');
    expect(code).toContain('[JsonPropertyName("id")]\n    public long Id { get; init; }');
    expect(code).toContain('public string Name { get; init; } = default!;');
    expect(code).toContain('public List<User> Users { get; init; } = default!;');
    expect(code).toContain('public string? Email { get; init; }');
    expect(code).toContain('[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]');
    expect(code).toContain('[JsonPropertyName("site-url")]\n    public object? SiteUrl { get; init; }');
  });
  it('classes use set accessors', () => {
    expect(gen({ lang: 'csharp', csStyle: 'class' }).code).toContain('public class Root');
    expect(gen({ lang: 'csharp', csStyle: 'class' }).code).toContain('public long Id { get; set; }');
  });
});

describe('Kotlin', () => {
  const { code, fileName } = gen({ lang: 'kotlin' });
  it('emits serializable data classes', () => {
    expect(fileName).toBe('Models.kt');
    expect(code).toContain('import kotlinx.serialization.Serializable');
    expect(code).toContain('import kotlinx.serialization.SerialName');
    expect(code).toContain('@Serializable\ndata class Root(');
    expect(code).toContain('    val id: Long,');
    expect(code).toContain('    val users: List<User>,');
    expect(code).toContain('    val email: String?,');
    expect(code).toContain('    val nickname: String? = null,');
    expect(code).toContain('    @SerialName("site-url") val siteUrl: JsonElement?,');
  });
});

describe('options', () => {
  it('uses the root name and original naming', () => {
    const { code } = gen({ lang: 'go', rootName: 'api response', naming: 'original' }, '{"user_id": 1}');
    expect(code).toMatch(/type ApiResponse struct/);
    expect(code).toMatch(/User_id\s+int64\s+`json:"user_id"`/);
  });
  it('names a root array and aliases it', () => {
    const { code } = gen({ lang: 'go' }, '[{"a":1},{"a":2,"b":"x"}]');
    expect(code).toContain('type Root []RootItem');
    expect(code).toMatch(/B\s+string\s+`json:"b,omitempty"`/);
    expect(gen({ lang: 'python' }, '[1,2]').code).toContain('Root = list[int]');
  });
  it('handles empty objects', () => {
    expect(gen({ lang: 'kotlin' }, '{}').code).toContain('@Serializable\nclass Root');
    expect(gen({ lang: 'python' }, '{}').code).toContain('class Root:\n    pass');
  });
});
