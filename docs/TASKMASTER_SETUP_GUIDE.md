# Taskmaster Setup Guide 
  
## „‚ƒ˜š Taskmaster Œ”˜…‰—ˆ ‡ƒ™ 
  
### ™Œ 1: „š—„  
  
npm install -g task-master-ai  
  
### ™Œ 2: €š‡…Œ „”˜…‰—ˆ  
  
task-master init --name="™ „”˜…‰—ˆ" --description="š‰€…˜ „”˜…‰—ˆ" 
  
### ™Œ 3: „‚ƒ˜š …ƒŒ‰ AI  
  
task-master models --setup  
  
### ™Œ 4: ‰–‰˜š PRD  
  
task-master parse-prd .taskmaster/docs/project-prd.txt 
  
## ”—…ƒ…š ™‰…™‰…š  
  
task-master list  
task-master next  
task-master add-task --prompt="š‰€…˜ „™‰„"  
task-master set-status --id=1 --status=done 
  
## ‰—… „—…•  
  
„—…• …— : docs/TASKMASTER_SETUP_GUIDE.md  
  
†„ „‰—… „‹… ‹‰:  
- —Œ Œ–…€ …Œ’ƒ‹  
- ‚‰™ Œ‹Œ „–……š  
- ‡Œ— „š‰’…ƒ ™Œ „”˜…‰—ˆ 
