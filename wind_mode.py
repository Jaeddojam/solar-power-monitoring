import tkinter as tk
from tkinter import messagebox

def activate_wind_mode():
    print("윈드 모드가 활성화되었습니다")

    root = tk.Tk()
    root.withdraw()
    messagebox.showinfo("윈드 모드", "윈드 모드가 활성화되었습니다")
    root.destroy()

if __name__ == "__main__":
    activate_wind_mode()
