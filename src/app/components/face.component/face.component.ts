import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
  NgZone,
  ChangeDetectorRef,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import { MainService } from '../../services/main.service';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-face',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, LoadingComponent],
  providers: [MainService],
  templateUrl: './face.component.html',
  styleUrls: ['./face.component.scss'],
})
export class FaceComponent implements AfterViewInit, OnDestroy {
  @Output() visibleChange = new EventEmitter<number>();

  dialogMessage = '';
  showDialog = false;

  @ViewChild('videoElement') videoElementRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElementRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ovalOverlay') ovalOverlayRef!: ElementRef<HTMLDivElement>;

  videoStream: MediaStream | null = null;
  faceLandmarker!: FaceLandmarker;

  cameraActive = false;
  statusMessage = 'Carregando modelo...';
  instructionMessage = 'Carregando modelo facial...';
  isSuccess = false;
  showCaptureButton = false;
  analysisStarted = false;

  private rafId: number | null = null;
  private lastDetectTime = 0;
  private frameCounter = 0;

  private THRESH_CENTER_X = 0.12;
  private THRESH_CENTER_Y = 0.14;
  private THRESH_ROLL_DEG = 12;
  private THRESH_YAW_RATIO_HIGH = 1.25;
  private THRESH_YAW_RATIO_LOW = 0.8;
  private THRESH_EYE_BRIGHTNESS = 38;

  isLoading = false;

  form = new FormGroup({
    image: new FormControl(''),
  });

  constructor(
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private mainService: MainService
  ) {}

  async ngAfterViewInit(): Promise<void> {
    await this.initFaceLandmarker();
    await this.startCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  async initFaceLandmarker() {
    try {
      const fileset = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
      );

      this.faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
      });

      this.zone.run(() => {
        this.statusMessage = 'Modelo carregado. Iniciando câmera...';
        this.instructionMessage =
          'Posicione seu rosto dentro da marcação e siga as instruções.';
        this.analysisStarted = true;
      });
    } catch (err) {
      console.error('Erro ao carregar modelo:', err);

      this.zone.run(() => {
        this.statusMessage = 'Erro ao carregar modelo facial.';
        this.instructionMessage = 'Erro ao carregar modelo facial.';
      });
    }
  }

  async startCamera() {
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });

      const video = this.videoElementRef.nativeElement;
      video.srcObject = this.videoStream;
      await video.play();

      this.zone.run(() => {
        this.cameraActive = true;
        this.statusMessage = 'Câmera ativa — analisando...';
        this.instructionMessage = 'Posicione seu rosto dentro da marcação.';
      });

      this.zone.runOutsideAngular(() => this.loopFaceDetection());
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);

      this.zone.run(() => {
        this.statusMessage =
          'Não foi possível acessar a câmera. Verifique as permissões.';
      });
    }
  }

  stopCamera() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.videoStream) {
      this.videoStream.getTracks().forEach((t) => t.stop());
      this.videoStream = null;
    }

    this.zone.run(() => {
      this.showCaptureButton = false;
    });
  }

  private loopFaceDetection() {
    const loop = async () => {
      const video = this.videoElementRef.nativeElement;

      if (!this.faceLandmarker || !video || video.readyState < 2) {
        this.rafId = requestAnimationFrame(loop);
        return;
      }

      const now = performance.now();
      if (now - this.lastDetectTime >= 80) {
        this.lastDetectTime = now;
        await this.processFrame();
      }

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  private async processFrame() {
    const video = this.videoElementRef.nativeElement;
    const canvas = this.canvasElementRef.nativeElement;

    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    if (!video.videoWidth || !video.videoHeight) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    let result;
    try {
      result = this.faceLandmarker.detectForVideo(video, performance.now());
    } catch {
      return;
    }

    if (!result?.faceLandmarks?.length) {
      this.updateStatus('Nenhum rosto detectado.', false, '#f44336');
      return;
    }

    const landmarks = result.faceLandmarks[0];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const noseTip = landmarks[1];

    if (!this.isValid(leftEye) || !this.isValid(rightEye)) {
      this.updateStatus('Ajuste a posição do rosto.', false, '#f44336');
      return;
    }

    const eyeDx = rightEye.x - leftEye.x;
    const eyeDy = rightEye.y - leftEye.y;
    const rollDeg = (Math.atan2(eyeDy, eyeDx) * 180) / Math.PI;

    const faceCenterX = (leftEye.x + rightEye.x) / 2;
    const faceCenterY = (leftEye.y + rightEye.y) / 2;
    const offsetX = faceCenterX - 0.5;
    const offsetY = faceCenterY - 0.5;

    const dLeft = Math.abs(noseTip.x - leftEye.x);
    const dRight = Math.abs(rightEye.x - noseTip.x);
    const yawRatio = dRight > 0 ? dLeft / dRight : 1;

    this.frameCounter++;

    let eyeBrightness: number | null = null;
    if (this.frameCounter % 6 === 0) {
      eyeBrightness = this.calcBrightness(ctx, leftEye, rightEye);
    }

    if (eyeBrightness !== null && eyeBrightness < this.THRESH_EYE_BRIGHTNESS)
      return this.updateStatus(
        'Remova os óculos escuros ou aumente a iluminação.',
        false,
        '#f44336'
      );

    if (Math.abs(rollDeg) > this.THRESH_ROLL_DEG)
      return this.updateStatus(
        `Cabeça inclinada para ${
          rollDeg > 0 ? 'a direita' : 'a esquerda'
        }. Endireite.`,
        false,
        '#f44336'
      );

    if (yawRatio > this.THRESH_YAW_RATIO_HIGH)
      return this.updateStatus('Vire um pouco à direita.', false, '#f44336');

    if (yawRatio < this.THRESH_YAW_RATIO_LOW)
      return this.updateStatus('Vire um pouco à esquerda.', false, '#f44336');

    if (offsetX > this.THRESH_CENTER_X)
      return this.updateStatus('Centralize mais para a esquerda.', false, '#f44336');

    if (offsetX < -this.THRESH_CENTER_X)
      return this.updateStatus('Centralize mais para a direita.', false, '#f44336');

    if (offsetY > this.THRESH_CENTER_Y)
      return this.updateStatus('Levante um pouco a cabeça.', false, '#f44336');

    if (offsetY < -this.THRESH_CENTER_Y)
      return this.updateStatus('Abaixe um pouco a cabeça.', false, '#f44336');

    this.updateStatus('Perfeito — rosto pronto para captura.', true, '#4caf50');
  }

  private isValid(p: any) {
    return p && typeof p.x === 'number' && typeof p.y === 'number';
  }

  private calcBrightness(
    ctx: CanvasRenderingContext2D,
    leftEye: any,
    rightEye: any
  ): number | null {
    try {
      const canvas = ctx.canvas;

      const lx = leftEye.x * canvas.width;
      const ly = leftEye.y * canvas.height;
      const rx = rightEye.x * canvas.width;
      const ry = rightEye.y * canvas.height;

      const x = Math.min(lx, rx) - 10;
      const y = Math.min(ly, ry) - 10;
      const w = Math.abs(rx - lx) + 20;
      const h = Math.abs(ry - ly) + 20;

      const img = ctx.getImageData(x, y, w, h);
      let total = 0;
      for (let i = 0; i < img.data.length; i += 4)
        total += (img.data[i] + img.data[i + 1] + img.data[i + 2]) / 3;

      return total / (img.data.length / 4);
    } catch {
      return null;
    }
  }

  private updateStatus(message: string, success: boolean, color: string) {
    this.zone.run(() => {
      this.statusMessage = message;
      this.isSuccess = success;
      this.showCaptureButton = success;

      const el = this.ovalOverlayRef?.nativeElement;
      if (el) {
        el.style.borderColor = color;
      }
    });
  }

  onCaptureClick() {
    if (!this.isSuccess) {
      this.zone.run(() => {
        this.dialogMessage = this.statusMessage;
        this.showDialog = true;
      });
      return;
    }
    this.captureImage();
  }

  async captureImage(): Promise<void> {
    const video = this.videoElementRef.nativeElement;
    const canvas = this.canvasElementRef.nativeElement;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const oval = this.ovalOverlayRef.nativeElement.getBoundingClientRect();
    const videoRect = video.getBoundingClientRect();

    const scaleX = canvas.width / videoRect.width;
    const scaleY = canvas.height / videoRect.height;

    const x = (oval.left - videoRect.left) * scaleX;
    const y = (oval.top - videoRect.top) * scaleY;
    const w = oval.width * scaleX;
    const h = oval.height * scaleY;

    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d')!;

    croppedCanvas.width = w;
    croppedCanvas.height = h;

    croppedCtx.save();
    croppedCtx.beginPath();
    croppedCtx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    croppedCtx.clip();
    croppedCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
    croppedCtx.restore();

    const imageDataUrl = croppedCanvas.toDataURL('image/jpeg', 0.9);

    this.zone.run(() => {
      this.form.get('image')!.setValue(imageDataUrl);
    });
  }

  closeVerification() {
    this.stopCamera();
    this.zone.run(() => {
      this.statusMessage = 'Verificação encerrada.';
    });
  }

  updateVisible(v: number) {
    this.visibleChange.emit(v);
  }

  async validateImage() {
    if (!this.isSuccess) {
      this.zone.run(() => {
        this.dialogMessage = this.statusMessage;
        this.showDialog = true;
      });
      return;
    }

    await this.captureImage();
    const imageFile = this.form.get('image')!.value;

    if (!imageFile) {
      this.zone.run(() => {
        this.dialogMessage = 'Imagem não informada.';
        this.showDialog = true;
      });
      return;
    }

    this.zone.run(() => (this.isLoading = true));
    this.mainService.setFormValue('image', imageFile);
    const response: any = await this.mainService.customerAccessFace(this.mainService.getFormValues());
    this.zone.run(() => {
      this.isLoading = false;
      if (response.status) {
        this.updateVisible(6);
      } else {
        this.dialogMessage = response.message;
        this.showDialog = true;
      }
    });
  }

  showDialogMessage(msg: string) {
    this.zone.run(() => {
      this.dialogMessage = msg;
      this.showDialog = true;
    });
  }

  closeDialog() {
    this.zone.run(() => {
      this.showDialog = false;
    });
  }
}
