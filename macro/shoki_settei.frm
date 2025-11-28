VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} shoki_settei 
   Caption         =   "初期設定"
   ClientHeight    =   5760
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   10810
   OleObjectBlob   =   "shoki_settei.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "shoki_settei"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Sub CommandButton2_Click()

Unload Me
start.Show

End Sub

Private Sub Image1_Click()

Unload Me
start.Show

End Sub

Private Sub Image3_Click()

Range("data!IR24") = 1
Range("data!IR2:IR7").Value = False
Range("data!IR" & ListBox1.ListIndex + 2).Value = True
With player_list
    .CheckBox1.Value = False
    .CheckBox2.Value = False
    .CheckBox3.Value = False
    .CheckBox4.Value = False
    .CheckBox5.Value = False
    .CheckBox6.Value = False
    .Controls("CheckBox" & ListBox1.ListIndex + 1) = True
End With
Range("data!IR24") = ""
player_list.Show

End Sub

Private Sub kettei_Click()

If ListBox1.Text = "" Then
    MsgBox "チームが選択されていません"
Else
    Range("チーム情報!K3").Value = ListBox1.List(ListBox1.ListIndex, 0)
    Sheets("チーム情報").Calculate
    Range("チーム情報!B2:G32").Value = Range("チーム情報!K2:P32").Value
    Range("選手リスト!B2:G101").Value = Range("チーム情報!Q2:V101").Value
End If

Calculate
Range("data!L20:L25").Value = Range("data!C20:C25").Value
Unload Me
main_menu.Show

End Sub

Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)
    If CloseMode = 0 Then
        MsgBox "閉じられません", 48
        Cancel = True
    End If
End Sub

Private Sub ListBox1_change()

Image3.left = 28
team_name.Caption = Sheets("チーム情報").Cells(2, ListBox1.ListIndex + 2).Value
yosan.Caption = "年俸予算：" & Sheets("チーム情報").Cells(10, ListBox1.ListIndex + 2).Value & "億円"
juni.Caption = "2013年シーズン順位：" & Sheets("チーム情報").Cells(37, ListBox1.ListIndex + 2).Value & "位"
shoukai1.Caption = Sheets("チーム情報").Cells(33, ListBox1.ListIndex + 2).Value
shoukai2.Caption = Sheets("チーム情報").Cells(34, ListBox1.ListIndex + 2).Value
shoukai3.Caption = Sheets("チーム情報").Cells(35, ListBox1.ListIndex + 2).Value
shoukai4.Caption = Sheets("チーム情報").Cells(36, ListBox1.ListIndex + 2).Value

End Sub

Private Sub UserForm_Initialize()

With ListBox1
    .ColumnCount = 2
    .ColumnWidths = "80;50"
    .RowSource = "チーム情報!I2:J7"
    .ColumnHeads = True
End With

End Sub
