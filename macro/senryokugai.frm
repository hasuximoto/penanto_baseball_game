VERSION 5.00
Begin {C62A69F0-16DC-11CE-9E98-00AA00574A4F} senryokugai 
   Caption         =   "戦力外通告"
   ClientHeight    =   7560
   ClientLeft      =   50
   ClientTop       =   380
   ClientWidth     =   9120
   OleObjectBlob   =   "senryokugai.frx":0000
   StartUpPosition =   1  'オーナー フォームの中央
End
Attribute VB_Name = "senryokugai"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False




Private Sub kaiko_Click()

If ListBox1.Text = "" Then
    MsgBox "選手を選択してください"
Else
    Range("data!C301").Value = ListBox1.List(ListBox1.ListIndex, 1)
    Range("data!A1000:HZ1100").Calculate
    
    If Range("data!E1090") = "" Then
        Range("data!L301") = "解雇"
        Call 選手データオープン
        Range("data!L301") = ""
        Range("data!A1000:HZ1100").Calculate
        ziyu_keiyaku.Caption = Range("data!K1001").Value
        With ListBox1
            .ColumnCount = 6
            .ColumnWidths = "60;80;30,50,150,150"
            .RowSource = "data!C1002:H" & Range("data!I1001") + 1001
            .ColumnHeads = True
        End With

    Else
        MsgBox Range("data!E1090").Value
    End If
End If

End Sub

Private Sub kaiko_end_Click()

If Range("data!E1091") > 68 Then
    MsgBox "選手総数を68名以下にしてください。（現在" & Range("data!E1091") & "名）"
Else
    Unload Me
    Call 解雇実行
End If

End Sub

Private Sub kaiko_label_Click()

End Sub

Private Sub Label1_Click()

End Sub

Private Sub Label7_Click()

End Sub

Private Sub Label8_Click()

Unload Me

End Sub

Private Sub ListBox1_Click()

End Sub

Private Sub UserForm_QueryClose(Cancel As Integer, CloseMode As Integer)
    If CloseMode = 0 Then
        MsgBox "閉じられません", 48
        Cancel = True
    End If
End Sub
Private Sub UserForm_Initialize()

ziyu_keiyaku.Caption = Range("data!K1001").Value
ninzu1.Caption = Range("data!E1083").Value
ninzu2.Caption = Range("data!E1084").Value
ninzu3.Caption = Range("data!E1085").Value
ninzu4.Caption = Range("data!E1086").Value
ninzu5.Caption = Range("data!E1087").Value
ninzu6.Caption = Range("data!E1088").Value

With ListBox1
    .ColumnCount = 6
    .ColumnWidths = "60;80;30,50,150,150"
    .RowSource = "data!C1002:H" & Range("data!I1001") + 1001
    .ColumnHeads = True
End With

End Sub

Private Sub ziyu_keiyaku_Click()

End Sub
