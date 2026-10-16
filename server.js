public class Form1 : GlassForm
    {
        private const int TitleBarHeight = 44;
        private const int CardShadowMargin = 18;

        private Panel titleBar = null!;
        private WinCaptionButton btnMinimize = null!, btnClose = null!;
        private Label lblTitle = null!;

        private Panel sidebarPanel = null!;
        private GlassButton btnGetStart = null!, btnSelectFile = null!, btnFixSystem = null!, btnContact = null!, btnOverlayDiscordLogin = null!;
        private ComboBox cbLanguage = null!;
        private Label lblLogo = null!, lblBackground = null!, lblUserInfo = null!;
        private TextBox txtProcessing = null!;
        private ProgressBar progressBar = null!;

        private Panel loginCard = null!;
        private Panel? blurLayer;
        private Label lblLoginTitle = null!, lblLoginDesc = null!;

        private string currentDiscordId = "";
        private AppSettings currentSettings = null!;
        private HttpListener? listener;
        private bool isGameRunning = false; // ตัวแปรป้องกันการเปิดเกมซ้อน

        private const string ClientId = "1559996775236898946";
        private const string ClientSecret = "geCVt_z43oOqwQXRi5Pi_ibvALmdQXgV";
        private const string RedirectUri = "http://127.0.0.1:5001/callback/";

        public Form1(AppSettings settings)
        {
            currentSettings = settings;
            currentDiscordId = settings.LastDiscordId;
            InitializeComponentCustom();
            UpdateLanguageUI();
        }

        private void InitializeComponentCustom()
        {
            this.Text = "Private Server Launcher";
            this.Size = new Size(900, 550);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.White;
            this.CornerRadius = 22;
            this.MaximizeBox = false;

            titleBar = new Panel
            {
                Location = Point.Empty,
                Size = new Size(this.ClientSize.Width, TitleBarHeight),
                BackColor = Color.FromArgb(243, 243, 243),
                Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right
            };

            btnClose = new WinCaptionButton { ButtonKind = WinCaptionButton.Kind.Close };
            btnMinimize = new WinCaptionButton { ButtonKind = WinCaptionButton.Kind.Minimize };

            btnClose.Click += (s, e) => this.Close();
            btnMinimize.Click += (s, e) => this.WindowState = FormWindowState.Minimized;

            lblTitle = new Label
            {
                Text = "Private Server Launcher",
                Font = new Font("Segoe UI", 10, FontStyle.Regular),
                ForeColor = Color.FromArgb(40, 40, 40),
                BackColor = Color.Transparent,
                AutoSize = false,
                TextAlign = ContentAlignment.MiddleLeft,
                Location = new Point(14, 0),
                Size = new Size(300, TitleBarHeight),
                Anchor = AnchorStyles.Top | AnchorStyles.Left
            };

            titleBar.Controls.Add(lblTitle);
            titleBar.Controls.Add(btnMinimize);
            titleBar.Controls.Add(btnClose);
            this.Controls.Add(titleBar);
            LayoutCaptionButtons();

            sidebarPanel = new Panel
            {
                Location = new Point(0, TitleBarHeight),
                Size = new Size(240, this.ClientSize.Height - TitleBarHeight),
                Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left,
                BackColor = Color.FromArgb(200, 200, 200)
            };
            this.Controls.Add(sidebarPanel);

            lblLogo = new Label
            {
                Text = "LOGICAL",
                Font = new Font("Tahoma", 14, FontStyle.Bold),
                Location = new Point(20, 10),
                Size = new Size(200, 60)
            };
            sidebarPanel.Controls.Add(lblLogo);

            btnGetStart = CreateSidebarButton("Get Start", 80, BtnGetStart_Click);
            btnSelectFile = CreateSidebarButton("Select game file", 140, BtnSelectFile_Click);
            btnFixSystem = CreateSidebarButton("Fix System", 200, BtnFixSystem_Click);
            btnContact = CreateSidebarButton("Contact", 260, BtnContact_Click);

            lblUserInfo = new Label
            {
                Font = new Font("Tahoma", 8),
                Location = new Point(20, sidebarPanel.Height - 40),
                Size = new Size(200, 30),
                Anchor = AnchorStyles.Bottom | AnchorStyles.Left
            };
            sidebarPanel.Controls.Add(lblUserInfo);

            cbLanguage = new ComboBox
            {
                Location = new Point(760, TitleBarHeight + 8),
                Size = new Size(100, 25),
                DropDownStyle = ComboBoxStyle.DropDownList,
                Anchor = AnchorStyles.Top | AnchorStyles.Right
            };
            cbLanguage.Items.AddRange(new string[] { "ภาษาไทย 🇹🇭", "English" });
            cbLanguage.SelectedIndex = currentSettings.SelectedLanguageIndex;
            cbLanguage.SelectedIndexChanged += CbLanguage_SelectedIndexChanged;
            this.Controls.Add(cbLanguage);

            lblBackground = new Label
            {
                Font = new Font("Tahoma", 20, FontStyle.Bold),
                ForeColor = Color.Gray,
                Location = new Point(500, 220),
                Size = new Size(200, 50)
            };
            this.Controls.Add(lblBackground);

            txtProcessing = new TextBox
            {
                Multiline = true,
                ReadOnly = true,
                Location = new Point(270, 360),
                Size = new Size(280, 100)
            };
            this.Controls.Add(txtProcessing);

            progressBar = new ProgressBar
            {
                Location = new Point(580, 430),
                Size = new Size(280, 30)
            };
            this.Controls.Add(progressBar);

            CreateLoginCard();

            titleBar.BringToFront();
            UpdateDragArea();

            this.FormClosing += (s, e) =>
            {
                GameProxyServer.StopProxy();
                StopListener();
            };

            this.Resize += (s, e) =>
            {
                titleBar.Width = this.ClientSize.Width;
                LayoutCaptionButtons();
                UpdateDragArea();
                CenterLoginCard();
            };

            this.Shown += (s, e) =>
            {
                if (!string.IsNullOrEmpty(currentDiscordId) && WhitelistManager.CheckWhitelist(currentDiscordId))
                {
                    if (blurLayer != null) blurLayer.Visible = false;
                    LoadPatchNotes();
                }
                else
                {
                    ShowLoginLayer();
                }
            };
        }

        private void LayoutCaptionButtons()
        {
            int x = titleBar.Width;
            btnClose.Location = new Point(x -= btnClose.Width, 0);
            btnMinimize.Location = new Point(x -= btnMinimize.Width, 0);
            lblTitle.Width = Math.Max(0, x - 14);
        }

        private void UpdateDragArea()
        {
            int captionWidth = btnMinimize.Width + btnClose.Width;
            this.DragArea = new Rectangle(0, 0, this.ClientSize.Width - captionWidth, TitleBarHeight);
        }

        private void CreateLoginCard()
        {
            int m = CardShadowMargin;
            loginCard = new Panel
            {
                Size = new Size(480 + m * 2, 270 + m * 2),
                BackColor = Color.Transparent
            };
            loginCard.Paint += (s, e) =>
                GlassPaint.Card(e.Graphics, new Rectangle(m, m, 480, 270), 26);

            lblLoginTitle = new Label
            {
                Font = new Font("Tahoma", 20, FontStyle.Bold),
                ForeColor = Color.Black,
                BackColor = Color.Transparent,
                Location = new Point(m + 20, m + 25),
                Size = new Size(440, 40),
                TextAlign = ContentAlignment.MiddleCenter
            };

            lblLoginDesc = new Label
            {
                Font = new Font("Tahoma", 10),
                ForeColor = Color.DimGray,
                BackColor = Color.Transparent,
                Location = new Point(m + 20, m + 75),
                Size = new Size(440, 55),
                TextAlign = ContentAlignment.MiddleCenter
            };

            btnOverlayDiscordLogin = new GlassButton
            {
                Font = new Font("Tahoma", 12, FontStyle.Bold),
                TintColor = Color.FromArgb(88, 101, 242),
                Location = new Point(m + 50, m + 155),
                Size = new Size(380, 55)
            };
            btnOverlayDiscordLogin.Click += async (s, e) => await StartDiscordOAuth();

            loginCard.Controls.Add(lblLoginTitle);
            loginCard.Controls.Add(lblLoginDesc);
            loginCard.Controls.Add(btnOverlayDiscordLogin);
        }

        private void ShowLoginLayer()
        {
            if (blurLayer == null)
            {
                Bitmap snap = Blur.Capture(this);
                blurLayer = new Panel
                {
                    Location = Point.Empty,
                    Size = ClientSize,
                    Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right,
                    BackgroundImage = snap,
                    BackgroundImageLayout = ImageLayout.Stretch
                };
                blurLayer.Controls.Add(loginCard);
                Controls.Add(blurLayer);
            }
            blurLayer.Visible = true;
            blurLayer.BringToFront();
            titleBar.BringToFront();
            CenterLoginCard();
        }

        private void CenterLoginCard()
        {
            if (loginCard == null || blurLayer == null) return;
            loginCard.Location = new Point(
                (blurLayer.Width - loginCard.Width) / 2,
                (blurLayer.Height - loginCard.Height) / 2);
        }

        private GlassButton CreateSidebarButton(string text, int top, EventHandler onClick)
        {
            var btn = new GlassButton
            {
                Text = text,
                Font = new Font("Tahoma", 11),
                Location = new Point(20, top),
                Size = new Size(200, 45),
                ForeColor = Color.FromArgb(30, 30, 40),
                TintColor = Color.FromArgb(150, 190, 255)
            };
            btn.Click += onClick;
            sidebarPanel.Controls.Add(btn);
            return btn;
        }

        private void UpdateLanguageUI()
        {
            bool isThai = cbLanguage != null && cbLanguage.SelectedIndex == 0;

            if (btnGetStart != null) btnGetStart.Text = isThai ? "เริ่มเกม" : "Get Start";
            if (btnSelectFile != null) btnSelectFile.Text = isThai ? "เลือกไฟล์เกม" : "Select game file";
            if (btnFixSystem != null) btnFixSystem.Text = isThai ? "ซ่อมแซมระบบ" : "Fix System";
            if (btnContact != null) btnContact.Text = isThai ? "ติดต่อทีมงาน" : "Contact";
            if (lblBackground != null) lblBackground.Text = isThai ? "พื้นหลัง" : "Background";

            if (lblLoginTitle != null) lblLoginTitle.Text = "Login with discord";
            if (lblLoginDesc != null)
            {
                lblLoginDesc.Text = isThai
                    ? "วิธีนี้ทำให้เราสามารถตรวจ whitelist ของท่านได้\nหากไม่มีจะไม่สามารถเข้าเล่นได้"
                    : "This method allows us to check your whitelist.\nWithout it, you cannot enter the game.";
            }
            if (btnOverlayDiscordLogin != null) btnOverlayDiscordLogin.Text = "Login with discord";

            string exeInfo = string.IsNullOrEmpty(currentSettings.GameExePath) ? "ยังไม่ได้เลือกไฟล์เกม" : Path.GetFileName(currentSettings.GameExePath);

            if (string.IsNullOrEmpty(currentDiscordId))
            {
                if (lblUserInfo != null) lblUserInfo.Text = isThai ? "สถานะ: ยังไม่ได้เข้าสู่ระบบ" : "Status: Not Logged In";
                if (txtProcessing != null)
                {
                    txtProcessing.Text = isThai
                        ? $"Processing...\r\n- โหลดการตั้งค่าสำเร็จ\r\n- ไฟล์เกม: {exeInfo}\r\n- สถานะ: กรุณาล็อกอิน"
                        : $"Processing...\r\n- Settings loaded successfully\r\n- Game: {exeInfo}\r\n- Status: Please login";
                }
            }
            else
            {
                if (lblUserInfo != null) lblUserInfo.Text = $"Discord ID: {currentDiscordId}";
                if (txtProcessing != null)
                {
                    txtProcessing.Text = isThai
                        ? $"Processing...\r\n- โหลดการตั้งค่าสำเร็จ\r\n- ไฟล์เกม: {exeInfo}\r\n- Discord ID: {currentDiscordId}"
                        : $"Processing...\r\n- Settings loaded successfully\r\n- Game: {exeInfo}\r\n- Discord ID: {currentDiscordId}";
                }
            }
        }

        private void CbLanguage_SelectedIndexChanged(object? sender, EventArgs e)
        {
            if (cbLanguage != null)
            {
                currentSettings.SelectedLanguageIndex = cbLanguage.SelectedIndex;
                currentSettings.Save();
                UpdateLanguageUI();
            }
        }

        private void StopListener()
        {
            if (listener != null)
            {
                try { listener.Stop(); } catch { }
                try { listener.Close(); } catch { }
                listener = null;
            }
        }

        private async Task StartDiscordOAuth()
        {
            bool isThai = cbLanguage != null && cbLanguage.SelectedIndex == 0;

            if (btnOverlayDiscordLogin != null)
            {
                btnOverlayDiscordLogin.Enabled = false;
                btnOverlayDiscordLogin.Text = isThai ? "กำลังรอยืนยันตัวตน..." : "Waiting for auth...";
            }

            StopListener();

            HttpListener? currentListener = null;
            try
            {
                currentListener = new HttpListener();
                currentListener.Prefixes.Add("http://127.0.0.1:5001/callback/");
                currentListener.Prefixes.Add("http://localhost:5001/callback/");
                currentListener.Start();
                listener = currentListener;

                string oauthUrl = $"https://discord.com/api/oauth2/authorize?client_id={ClientId}&redirect_uri={Uri.EscapeDataString(RedirectUri)}&response_type=code&scope=identify";

                Process.Start(new ProcessStartInfo
                {
                    FileName = oauthUrl,
                    UseShellExecute = true
                });

                HttpListenerContext context;
                try
                {
                    context = await currentListener.GetContextAsync();
                }
                catch (ObjectDisposedException)
                {
                    return;
                }
                catch (HttpListenerException)
                {
                    return;
                }

                string? code = context.Request.QueryString["code"];

                string responseString = "<html><body style='font-family:sans-serif;text-align:center;padding-top:50px;background:#1e1e2e;color:#ffffff;'><h2>ยืนยันตัวตนสำเร็จ! / Authentication Successful!</h2><p>สามารถปิดหน้านี้และกลับไปที่ Launcher ได้เลยครับ</p></body></html>";
                byte[] buffer = System.Text.Encoding.UTF8.GetBytes(responseString);
                context.Response.ContentLength64 = buffer.Length;
                context.Response.ContentType = "text/html; charset=utf-8";
                await context.Response.OutputStream.WriteAsync(buffer, 0, buffer.Length);
                context.Response.OutputStream.Close();

                StopListener();

                if (string.IsNullOrEmpty(code))
                {
                    MessageBox.Show(isThai ? "ยกเลิกการยืนยันตัวตน หรือไม่ได้รับ Authorization Code" : "Authentication canceled or Code not received", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    ResetButton();
                    return;
                }

                string? userId = await GetDiscordUserIdFromCode(code);

                if (string.IsNullOrEmpty(userId))
                {
                    MessageBox.Show(isThai ? "ไม่สามารถดึงข้อมูล Discord User ID ได้" : "Failed to retrieve Discord User ID", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    ResetButton();
                    return;
                }

                if (!WhitelistManager.CheckWhitelist(userId))
                {
                    MessageBox.Show(isThai ? $"Discord User ID: {userId}\n\nบัญชีนี้ยังไม่ได้รับสิทธิ์ Whitelist!" : $"Discord User ID: {userId}\n\nThis account is not whitelisted!", "Access Denied", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    ResetButton();
                    return;
                }

                currentDiscordId = userId;
                currentSettings.LastDiscordId = userId;
                currentSettings.Save();

                UpdateLanguageUI();

                if (blurLayer != null) blurLayer.Visible = false;
                LoadPatchNotes();

                MessageBox.Show(isThai ? "ยืนยันตัวตนและตรวจเช็ค Whitelist สำเร็จ!" : "Successfully authenticated and Whitelist verified!", "Success", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                StopListener();
                if (!ex.Message.Contains("aborted") && !(ex is ObjectDisposedException))
                {
                    MessageBox.Show(isThai ? $"เกิดข้อผิดพลาดในการยืนยันตัวตน: {ex.Message}" : $"OAuth Error: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
                ResetButton();
            }
        }

        private async Task<string?> GetDiscordUserIdFromCode(string code)
        {
            using var client = new HttpClient();
            var tokenRequestParams = new Dictionary<string, string>
            {
                { "client_id", ClientId },
                { "client_secret", ClientSecret },
                { "grant_type", "authorization_code" },
                { "code", code },
                { "redirect_uri", RedirectUri }
            };

            var response = await client.PostAsync("https://discord.com/api/oauth2/token", new FormUrlEncodedContent(tokenRequestParams));
            if (!response.IsSuccessStatusCode) return null;

            string jsonResponse = await response.Content.ReadAsStringAsync();
            using var jsonDoc = JsonDocument.Parse(jsonResponse);
            string? accessToken = jsonDoc.RootElement.GetProperty("access_token").GetString();

            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
            var userResponse = await client.GetAsync("https://discord.com/api/users/@me");
            if (!userResponse.IsSuccessStatusCode) return null;

            string userJson = await userResponse.Content.ReadAsStringAsync();
            using var userDoc = JsonDocument.Parse(userJson);
            return userDoc.RootElement.GetProperty("id").GetString();
        }

        private void ResetButton()
        {
            if (btnOverlayDiscordLogin != null) btnOverlayDiscordLogin.Enabled = true;
            UpdateLanguageUI();
            StopListener();
        }

        private async void BtnGetStart_Click(object? sender, EventArgs e)
        {
            bool isThai = cbLanguage != null && cbLanguage.SelectedIndex == 0;

            // ป้องกันการกดซ้ำขณะเกมกำลังเปิดหรือรันอยู่
            if (isGameRunning)
            {
                MessageBox.Show(isThai ? "เกมกำลังทำงานอยู่แล้ว!" : "The game is already running!", "Warning", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if (string.IsNullOrEmpty(currentDiscordId))
            {
                MessageBox.Show(isThai ? "กรุณาล็อกอินด้วย Discord เพื่อตรวจสอบ Whitelist ก่อนเริ่มเกม!" : "Please login with Discord to verify Whitelist before starting!", "Warning", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if (string.IsNullOrEmpty(currentSettings.GameExePath) || !File.Exists(currentSettings.GameExePath))
            {
                MessageBox.Show(isThai ? "กรุณาเลือกไฟล์เกม (.exe) ของ Home Sweet Home ก่อนเริ่มเกม!" : "Please select the game executable (.exe) first!", "Warning", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                BtnSelectFile_Click(sender, e);
                if (string.IsNullOrEmpty(currentSettings.GameExePath) || !File.Exists(currentSettings.GameExePath)) return;
            }

            isGameRunning = true;
            if (btnGetStart != null) btnGetStart.Enabled = false; // ล็อกปุ่มเริ่มเกมชั่วคราว

            if (txtProcessing != null)
                txtProcessing.AppendText(isThai ? "\r\n[Get Start] กำลังตั้งค่าระบบ Network และ Proxy..." : "\r\n[Get Start] Setting up Network and Proxy...");

            if (progressBar != null) progressBar.Value = 50;

            try
            {
                await GameProxyServer.StartProxy();
                if (txtProcessing != null)
                    txtProcessing.AppendText(isThai ? "\r\n[Proxy] เปิดใช้งานสำเร็จ (เชื่อมต่อไปยัง Render)" : "\r\n[Proxy] Proxy started successfully (Connected to Render)");

                if (progressBar != null) progressBar.Value = 100;

                try
                {
                    var gameProcess = Process.Start(new ProcessStartInfo
                    {
                        FileName = currentSettings.GameExePath,
                        WorkingDirectory = Path.GetDirectoryName(currentSettings.GameExePath),
                        UseShellExecute = true
                    });

                    if (txtProcessing != null)
                        txtProcessing.AppendText(isThai ? "\r\n[Game] เปิดเกมสำเร็จแล้ว!" : "\r\n[Game] Game launched successfully!");

                    // เฝ้าดูสถานะ เมื่อเกมปิดตัวลงค่อยปลดล็อกปุ่มให้กดเริ่มใหม่ได้
                    if (gameProcess != null)
                    {
                        _ = Task.Run(() =>
                        {
                            gameProcess.WaitForExit();
                            isGameRunning = false;
                            this.Invoke((MethodInvoker)delegate {
                                if (btnGetStart != null) btnGetStart.Enabled = true;
                            });
                        });
                    }
                    else
                    {
                        isGameRunning = false;
                        if (btnGetStart != null) btnGetStart.Enabled = true;
                    }
                }
                catch (Exception ex)
                {
                    isGameRunning = false;
                    if (btnGetStart != null) btnGetStart.Enabled = true;
                    MessageBox.Show(isThai ? $"ไม่สามารถเปิดไฟล์เกมได้: {ex.Message}" : $"Failed to launch game: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
            catch (Exception ex)
            {
                isGameRunning = false;
                if (btnGetStart != null) btnGetStart.Enabled = true;
                MessageBox.Show($"Proxy Error: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void BtnSelectFile_Click(object? sender, EventArgs e)
        {
            bool isThai = cbLanguage != null && cbLanguage.SelectedIndex == 0;
            using var openFileDialog = new OpenFileDialog
            {
                Filter = "Game Executable (*.exe)|*.exe",
                Title = isThai ? "เลือกไฟล์ .exe ของเกม Home Sweet Home" : "Select HSH Game Executable"
            };

            if (openFileDialog.ShowDialog() == DialogResult.OK)
            {
                currentSettings.GameExePath = openFileDialog.FileName;
                currentSettings.Save();
                UpdateLanguageUI();
                if (txtProcessing != null)
                    txtProcessing.AppendText($"\r\n[File] Selected: {openFileDialog.FileName}");
            }
        }

        private void BtnFixSystem_Click(object? sender, EventArgs e)
        {
            bool isThai = cbLanguage != null && cbLanguage.SelectedIndex == 0;
            if (txtProcessing != null)
                txtProcessing.AppendText(isThai ? "\r\n[Fix System] กำลังซ่อมแซมไฟล์ระบบ..." : "\r\n[Fix System] Repairing system files...");
        }

        private void BtnContact_Click(object? sender, EventArgs e)
        {
            bool isThai = cbLanguage != null && cbLanguage.SelectedIndex == 0;
            MessageBox.Show(isThai ? "ติดต่อซัพพอร์ตผ่าน Discord" : "Contact support via Discord", "Contact", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void LoadPatchNotes()
        {
            bool isThai = cbLanguage != null && cbLanguage.SelectedIndex == 0;

            Bitmap snap = Blur.Capture(this);
            var backdrop = new Form
            {
                FormBorderStyle = FormBorderStyle.None,
                StartPosition = FormStartPosition.Manual,
                ShowInTaskbar = false,
                BackgroundImage = snap,
                BackgroundImageLayout = ImageLayout.Stretch,
                Bounds = RectangleToScreen(ClientRectangle)
            };
            backdrop.Show(this);

            using (var dlg = new PatchNotesDialog(isThai))
            {
                dlg.ShowDialog(backdrop);
            }

            backdrop.Dispose();
            snap.Dispose();
        }
    }
