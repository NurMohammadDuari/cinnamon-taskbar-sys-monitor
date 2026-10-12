import tkinter as tk
import random

WIDTH = 600
HEIGHT = 400
CELL = 20
DELAY = 100

class SnakeGame:
    def __init__(self, root):
        self.root = root
        root.title("Python Snake")
        root.resizable(False, False)

        self.score = 0
        self.high = 0
        self.direction = "Right"
        self.next_dir = "Right"
        self.running = True

        self.top = tk.Frame(root)
        self.top.pack(fill="x")
        self.score_label = tk.Label(self.top, text="Score: 0  Best: 0", font=("Arial", 14))
        self.score_label.pack(side="left", padx=10)
        tk.Button(self.top, text="Restart (R)", command=self.restart).pack(side="right", padx=10)

        self.canvas = tk.Canvas(root, width=WIDTH, height=HEIGHT, bg="black")
        self.canvas.pack()

        root.bind("<Up>", lambda e: self.set_dir("Up"))
        root.bind("<Down>", lambda e: self.set_dir("Down"))
        root.bind("<Left>", lambda e: self.set_dir("Left"))
        root.bind("<Right>", lambda e: self.set_dir("Right"))
        root.bind("w", lambda e: self.set_dir("Up"))
        root.bind("s", lambda e: self.set_dir("Down"))
        root.bind("a", lambda e: self.set_dir("Left"))
        root.bind("d", lambda e: self.set_dir("Right"))
        root.bind("r", lambda e: self.restart())
        root.bind("R", lambda e: self.restart())

        self.restart()

    def restart(self):
        cx, cy = WIDTH // 2, HEIGHT // 2
        self.snake = [(cx, cy), (cx - CELL, cy), (cx - 2 * CELL, cy)]
        self.direction = "Right"
        self.next_dir = "Right"
        self.score = 0
        self.running = True
        self.spawn_food()
        self.update_label()
        self.tick()

    def set_dir(self, d):
        opposite = {"Up": "Down", "Down": "Up", "Left": "Right", "Right": "Left"}
        if d != opposite.get(self.direction):
            self.next_dir = d

    def spawn_food(self):
        while True:
            x = random.randrange(0, WIDTH // CELL) * CELL
            y = random.randrange(0, HEIGHT // CELL) * CELL
            if (x, y) not in self.snake:
                self.food = (x, y)
                return

    def update_label(self):
        self.score_label.config(text=f"Score: {self.score}  Best: {self.high}")

    def tick(self):
        if not self.running:
            return
        self.direction = self.next_dir
        hx, hy = self.snake[0]
        if self.direction == "Up":
            hy -= CELL
        elif self.direction == "Down":
            hy += CELL
        elif self.direction == "Left":
            hx -= CELL
        elif self.direction == "Right":
            hx += CELL
        new_head = (hx, hy)

        # wall or self collision
        if hx < 0 or hy < 0 or hx >= WIDTH or hy >= HEIGHT or new_head in self.snake:
            self.game_over()
            return

        self.snake.insert(0, new_head)
        if new_head == self.food:
            self.score += 1
            self.high = max(self.high, self.score)
            self.spawn_food()
        else:
            self.snake.pop()

        self.draw()
        self.update_label()
        self.root.after(DELAY, self.tick)

    def draw(self):
        self.canvas.delete("all")
        fx, fy = self.food
        self.canvas.create_oval(fx + 2, fy + 2, fx + CELL - 2, fy + CELL - 2, fill="red", outline="")
        for i, (x, y) in enumerate(self.snake):
            color = "lime" if i == 0 else "green"
            self.canvas.create_rectangle(x + 1, y + 1, x + CELL - 1, y + CELL - 1, fill=color, outline="")

    def game_over(self):
        self.running = False
        self.draw()
        self.canvas.create_text(WIDTH // 2, HEIGHT // 2 - 10,
                                text=f"GAME OVER  Score: {self.score}",
                                fill="white", font=("Arial", 22, "bold"))
        self.canvas.create_text(WIDTH // 2, HEIGHT // 2 + 25,
                                text="Press R to restart",
                                fill="yellow", font=("Arial", 14))

if __name__ == "__main__":
    root = tk.Tk()
    game = SnakeGame(root)
    root.mainloop()
