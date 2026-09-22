import { MAX_SOURCE } from './utils.js';

/** Lightweight GLSL editor with real textarea semantics, safe tokenization, and no dependencies. */
export class CodeEditor {
  constructor(textarea,pre,gutter,onChange) {
    textarea.maxLength=MAX_SOURCE;
    this.textarea=textarea;this.pre=pre;this.gutter=gutter;this.onChange=onChange;
    textarea.addEventListener('input',()=>{this.highlight();onChange(textarea.value);});
    textarea.addEventListener('scroll',()=>this.syncScroll());
    textarea.addEventListener('keydown',e=>{
      if(e.key==='Tab'){
        e.preventDefault();const start=textarea.selectionStart,end=textarea.selectionEnd;
        if(textarea.value.length-(end-start)+2>MAX_SOURCE)return;
        textarea.setRangeText('  ',start,end,'end');this.highlight();onChange(textarea.value);
      }
      if(e.key==='Escape'){e.preventDefault();document.querySelector('#compileCode')?.focus();}
    });
  }
  setValue(value){this.textarea.value=value;this.highlight();}
  get value(){return this.textarea.value;}
  syncScroll(){this.pre.scrollTop=this.textarea.scrollTop;this.pre.scrollLeft=this.textarea.scrollLeft;this.gutter.scrollTop=this.textarea.scrollTop;}
  highlight(){
    const source=this.textarea.value;
    const regex=/\/\/[^\n]*|\/\*[\s\S]*?\*\/|\b(?:void|float|int|bool|vec[234]|mat[234]|uniform|return|if|else|for|break|continue|true|false|out|in|const|precision|highp|mediump)\b|\b(?:sin|cos|tan|atan|abs|length|normalize|dot|pow|exp|log2|fract|mod|floor|mix|smoothstep|clamp|palette|rotate|noise2|fbm|stroke)\b|\b\d+(?:\.\d*)?(?:[eE][+-]?\d+)?\b/g;
    const frag=document.createDocumentFragment();let last=0;
    for(const m of source.matchAll(regex)){
      if(m.index>last)frag.append(document.createTextNode(source.slice(last,m.index)));
      const span=document.createElement('span');span.textContent=m[0];
      span.className=m[0].startsWith('/')?'token-comment':/^\d/.test(m[0])?'token-number':/^(void|float|int|bool|vec|mat|uniform|return|if|else|for|break|continue|true|false|out|in|const|precision|highp|mediump)/.test(m[0])?'token-type':'token-function';
      frag.append(span);last=m.index+m[0].length;
    }
    frag.append(document.createTextNode(source.slice(last)+'\n'));
    this.pre.querySelector('code').replaceChildren(frag);
    this.gutter.textContent=Array.from({length:source.split('\n').length+1},(_,i)=>i+1).join('\n');this.syncScroll();
  }
}
