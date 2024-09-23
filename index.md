### Headers

# This is a test header for `H1`
## This is a test header for `H2`
###### This is a test header for `H6`

---

### Showing Image

![Image of Yaktocat](https://cdn.discordapp.com/attachments/1041951848107614229/1287776953557848095/OMEN.jpg?ex=66f2c73f&is=66f175bf&hm=68ef62c7edab1df1b6b78be772dd757f4dcf6903166b4a50abfd367ba5f9da5a&)

---

### Adding code blocks

```ts
function addNumbers(input: string) {
    const numbers = input.split(',').map(n => parseInt(n));
    if (!numbers.length) {
        throw new Error('No numbers provided, make sure the input is a string of numbers separated by commas');
    }

    return numbers.reduce((total, n) => total + n);
}
```

---

### Listing

- [x] I want to die
- [x] Sometimes it's like going through hell
- [ ] Life is complete 😃

---

### Creating A Table

| Something | Something |
| --------- | --------- |
| Cell      | Cell      |
| Cell      | Cell      |

---

### Formatting content

| Index | To use | Description | Example |
| :-----: | :-----: | :----------- | :-------: |
| 1 | `**`    | Used to show content bold       | `**Ello**` • **Ello**             |
| 2 | `_`     | Used to show content in italics | `_Kiwii_`  • _Kiwii_              |
| 3 | `*`     | Used to show content in italics | `*Kiwii 2*`  • *Kiwii 2*          |
| 4 | `<ins>` | Used to show an underline       | `<ins>Text<ins>` • <ins>Text<ins> |

--- 

### Creating a collapsed section

<details>
<summary>This is an amazing section, click here to be amazed! </summary>

### *Ofc we need a header for this section bruh*

So let me tell you about this ***Amazing thing!***
> You got tricked to click on it 🤣

```js
console.log("Bro got tricked, [+1] for Kevin!");
```

</details>