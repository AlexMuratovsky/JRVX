import test from 'node:test';import assert from 'node:assert/strict';
import {seed,esc,safeLoad,save,subjectInitials,extractPlannerSubjects,buildPrompt,isValidSubject,isValidDeadline,TOOLS} from '../src/core.js';
const memory=()=>{const m=new Map();return {getItem:x=>m.get(x)||null,setItem:(x,y)=>m.set(x,y)}};
test('state loads seed and persists',()=>{const m=memory(),s=safeLoad(m);assert.equal(s.country,'Россия');assert.equal(s.subjects.length,3);s.country='Казахстан';save(m,s);assert.equal(safeLoad(m).country,'Казахстан');});
test('subject names validate and initials display',()=>{assert.equal(subjectInitials('Лучевая диагностика'),'ЛД');assert.equal(isValidSubject('Анатомия',[{name:'анатомия'}]),false);assert.equal(isValidSubject('Хирургия'),true);});
test('HTML inputs escape unsafe markup',()=>{assert.equal(esc('<img src="x" onerror="evil">'),'&lt;img src=&quot;x&quot; onerror=&quot;evil&quot;&gt;');});
test('planner extracts deduplicated subjects, does not confuse titles',()=>{const data={schedule:[{subject:'Биохимия',topic:'Что-то'},{subject:'Биохимия'},{discipline:'Патофизиология'}]};assert.deepEqual(extractPlannerSubjects(data),['Биохимия','Патофизиология']);});
test('request reflects one option and selected country',()=>{const text=buildPrompt({subject:'Патофизиология',tool:TOOLS.find(t=>t.id==='quiz'),topic:'Некроз',option:'Сложный',country:'Россия'});assert.match(text,/Сложный/);assert.match(text,/Россия/);assert.match(text,/Не выдумывай|не придумывай/i);});
test('deadline date grammar',()=>{assert.equal(isValidDeadline('2026-10-28'),true);assert.equal(isValidDeadline('28.10.2026'),false);});
