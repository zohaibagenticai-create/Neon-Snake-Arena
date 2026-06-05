export const maps = {
  classic: [],
  infinite: [],
  maze: [
    ...Array.from({length:10},(_,i)=>({x:7,y:i+4})),
    ...Array.from({length:10},(_,i)=>({x:16,y:i+10})),
    ...Array.from({length:8},(_,i)=>({x:i+8,y:7})),
    ...Array.from({length:8},(_,i)=>({x:i+8,y:17}))
  ],
  arena: [
    ...Array.from({length:24},(_,i)=>({x:i,y:0})),
    ...Array.from({length:24},(_,i)=>({x:i,y:23})),
    ...Array.from({length:22},(_,i)=>({x:0,y:i+1})),
    ...Array.from({length:22},(_,i)=>({x:23,y:i+1})),
    {x:5,y:5},{x:18,y:5},{x:5,y:18},{x:18,y:18}
  ]
};
