# Taskmaster Setup Guide 
  
## ����� Taskmaster ������� ��� 
  
### ��� 1: �����  
  
npm install -g task-master-ai  
  
### ��� 2: ����� �������  
  
task-master init --name="�� �������" --description="����� �������" 
  
### ��� 3: ����� ������ AI  
  
task-master models --setup  
  
### ��� 4: ����� PRD  
  
task-master parse-prd .taskmaster/docs/project-prd.txt 
  
## ������ ��������  
  
task-master list  
task-master next  
task-master add-task --prompt="����� ������"  
task-master set-status --id=1 --status=done 
  
## ����� �����  
  
����� ����� �: docs/TASKMASTER_SETUP_GUIDE.md  
  
�� ������ ����� ��:  
- �� ����� ������  
- ���� ��� �����  
- ��� ������� �� ������� 
