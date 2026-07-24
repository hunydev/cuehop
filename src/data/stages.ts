import {E,num,op} from '../engine/engine'; import type {Block,Stage} from '../engine/types';
const id=()=>crypto.randomUUID?.()??Math.random().toString(36);
export const move=(axis:'x'|'y',expr=E):Block=>({id:id(),type:'move',axis,expr});
export const condition=():Block=>({id:id(),type:'condition',left:E,compare:'eq',right:num(2),then:[move('x',op('+',E,num(1)))],else:[move('x',E)]});
export const answers:Record<string,Block[]>={
 t1:[move('x',E)], t2:[move('y',E)], t3:[move('x',E),move('y',E)], t4:[move('x',op('*',E,num(2)))], t5:[condition()]
};
export const stages:Stage[]=[
{id:'t1',name:'First Cue',koName:'첫 번째 신호',width:5,height:1,goal:{x:4,y:0},hazards:[],energy:6,available:['x를 E로'],starter:answers.t1,targetTicks:4,starLineLimit:1,guide:['E는 한 박자마다 1씩 커져요.','x를 E로 맞추면 오른쪽으로 한 칸씩 점프해요.']},
{id:'t2',name:'Look Up',koName:'위를 향해',width:1,height:5,goal:{x:0,y:4},hazards:[],energy:6,available:['y를 E로'],starter:answers.t2,targetTicks:4,starLineLimit:1,guide:['y가 커지면 위쪽으로 점프해요.']},
{id:'t3',name:'Order Makes the Path',koName:'순서가 만드는 길',width:5,height:5,goal:{x:4,y:4},hazards:[],energy:6,available:['x를 E로','y를 E로'],starter:answers.t3,targetTicks:4,starLineLimit:2,guide:['한 박자 안에서도 블록은 위에서 아래로 실행돼요.','블록의 순서를 바꾸면 점프 경로도 달라져요.']},
{id:'t4',name:'Leap Ahead',koName:'멀리 뛰기',width:5,height:1,goal:{x:4,y:0},hazards:[{x:1,y:0,kind:'구멍'},{x:3,y:0,kind:'구멍'}],energy:4,available:['x를 E × 2로'],starter:answers.t4,targetTicks:2,starLineLimit:1,guide:['좌표가 멀리 바뀌면 한 번에 멀리 점프해요.','위험한 타일도 착지만 하지 않으면 뛰어넘을 수 있어요.']},
{id:'t5',name:'Only Then',koName:'그때만 점프',width:5,height:1,goal:{x:4,y:0},hazards:[{x:2,y:0,kind:'가시'}],energy:6,available:['조건: E가 2일 때','then: x를 E + 1로','else: x를 E로'],starter:answers.t5,targetTicks:4,starLineLimit:3,guide:['조건이 맞을 때만 안쪽 블록을 실행해요.','좌표가 그대로라면 점프하지 않고 한 박자 기다려요.']}
];
export function cloneBlocks(blocks:Block[]):Block[]{return JSON.parse(JSON.stringify(blocks))}
export function makeAvailable(stage:Stage,label:string):Block{if(label.startsWith('y'))return move('y',E); if(label.includes('×'))return move('x',op('*',E,num(2))); if(label.startsWith('조건'))return condition(); return move('x',E)}
