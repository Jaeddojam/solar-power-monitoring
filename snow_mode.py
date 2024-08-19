import tkinter as tk
from tkinter import messagebox
import RPi.GPIO as GPIO
import time

servo_pin1 = 7  # 첫 번째 서보 모터 핀 번호
servo_pin2 = 12  # 두 번째 서보 모터 핀 번호

GPIO.setmode(GPIO.BCM)
GPIO.setup(servo_pin1, GPIO.OUT)
GPIO.setup(servo_pin2, GPIO.OUT)

pwm1 = GPIO.PWM(servo_pin1, 50)  # 첫 번째 PWM 주파수 50Hz 설정
pwm2 = GPIO.PWM(servo_pin2, 50)  # 두 번째 PWM 주파수 50Hz 설정

pwm1.start(7.5)  # 첫 번째 서보 모터 기본 위치 설정 (90도)
pwm2.start(7.5)  # 두 번째 서보 모터 기본 위치 설정 (90도)

try:
    while True:
        pwm1.ChangeDutyCycle(11.8)  # 첫 번째 서보를 기본 위치로 이동
        pwm2.ChangeDutyCycle(7.5)  # 두 번째 서보를 기본 위치로 이동
        time.sleep(1)

finally:
    pwm1.stop()
    pwm2.stop()
    GPIO.cleanup()

def activate_snow_mode():
    # 스노우 모드가 활성화되었음을 콘솔에 출력
    print("스노우 모드가 활성화되었습니다")

    # GUI 창을 생성하여 메시지 출력
    root = tk.Tk()
    root.withdraw()  # 메인 윈도우 숨기기
    messagebox.showinfo("스노우 모드", "스노우 모드가 활성화되었습니다")
    root.destroy()  # 메시지 박스 닫으면 창 닫기

if __name__ == "__main__":
    activate_snow_mode()
