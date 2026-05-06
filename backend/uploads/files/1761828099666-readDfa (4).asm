%include "constants.inc"
global readDfa
extern fopen, fclose, fscanf, fgets, strtok, atoi, initDfa

section .data
mode db "r", 0
comma db ",", 0
count_format db "%d,%d", 10, 0
trans_format db "%d,%d,%c", 10, 0

section .text
;
; DFA *readDfa(const char *filename)
;
readDfa:
  ret