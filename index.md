# Teste de conteudo sobre Markdown
![Imagem gatinho](https://cdn.discordapp.com/attachments/839706431724322857/1279557555709804605/Imagem_do_WhatsApp_de_2024-01-06_as_19.58.41_2b95dc8f.jpg?ex=66d4e056&is=66d38ed6&hm=58b641c54558fd4626a6be688b1d84a3f2559a5c3ff397bb246cdb77ab5b76cf&)
```
import pyautogui
import keyboard
import time, sys

def loop():
	pyautogui.PAUSE = 0.001
	pyautogui.tripleClick()
	pyautogui.doubleClick()

while True:
	loop()
	if keyboard.is_pressed('p'):
		sys.exit()
	if keyboard.is_pressed('r'):
		time.sleep(5)

``` 
- [ ] Comida pro manquinho
- [ ] Fazer a atividade do Curso
- [ ] Criar um script de localização do mouse na tela 
